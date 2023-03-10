const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const CloudServers = require("../../database/entities/CloudServers");
const Servers = require("../../database/entities/Servers");
const TransactionHistorys = require("../../database/entities/TransactionHistorys");
const generateRandomString = require("../../helpers/generateRandomString");
const User = require("../../database/entities/authentication/Users");
const Users = require("../../database/entities/authentication/Users");
const Order = require("../../database/entities/Order");
const moment = require("moment");
const Logs = require("../../database/entities/Logs");
const schedule = require("node-schedule");
const expiryDateTypeToNumber = require("../../helpers/expiryDateTypeToNumber");
const { createNotification } = require("./notificationController");
const { setActionStatus } = require("../routes/actionMiddleWare");
const OperatingSystems = require("../../database/entities/OperatingSystems");
const axios = require('axios');
const Ip = require("../../database/entities/Ip");
const Socket = require("../../database/entities/Socket");

async function switchAutoRenewServer(req, res) {
  try {
    const id = req.params.id;
    const thisServer = await CloudServers.findById(id);
    const result = await CloudServers.findByIdAndUpdate(id, {
      isAutoRenew: req.body.isAutoRenew,
    });
    await setActionStatus(
      req.actionId,
      req.body.isAutoRenew
        ? `Bật tự động gia hạn cho cloud server ${thisServer.code}`
        : `Tắt tự động gia hạn cho cloud server ${thisServer.code}`,
      "success"
    );
    return res.status(200).json({
      message: req.body.isAutoRenew
        ? "Cloud server sẽ tự gia hạn"
        : "Cloud server sẽ không tự gia hạn",
    });
  } catch (error) {
    console.log(error);
    await setActionStatus(
      req.actionId,
      req.body.isAutoRenew
        ? `Bật tự động gia hạn cho cloud server ${thisServer.code}`
        : `Tắt tự động gia hạn cho cloud server ${thisServer.code}`,
      "fail"
    );
    return res.status(500).json({ message: error });
  }
}

async function softDeleteCloudServer(req, res) {
  try {
    const thisServer = await CloudServers.findById(req.params.id);
    const result = await CloudServers.findByIdAndUpdate(req.params?.id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    await setActionStatus(
      req.actionId,
      `Xoá cloud server ${thisServer.code}`,
      "success"
    );
    return res.status(200).json({ message: "Huỷ cloud server thành công" });
  } catch (error) {
    console.log(error);
    await setActionStatus(req.actionId, `Xoá cloud server`, "fail");
    return res.status(500).json({ message: error });
  }
}

async function getAboutToExpireCloudServer(req, res) {
  try {
    let pageSize = req.query.pageSize || 10;
    let pageIndex = req.query.pageIndex || 1;
    let searchObj = {
      isDeleted: {
        $ne: true,
      },
      expiryDate: {
        $lt: new Date(new Date().setDate(new Date().getDate() + 3)),
        $gt: new Date(),
      },
    };
    if (req.query.search) {
      searchObj.cloudServerName = { $regex: ".*" + req.query.search + ".*" };
    }
    if (req.query.userId) {
      searchObj.user = req.query.userId;
    }
    if (req.query.areaId) {
      searchObj.area = req.query.areaId;
    }
    if (req.query.operatingSystemId) {
      searchObj.operatingSystem = req.query.operatingSystemId;
    }

    try {
      let cloudServer = await CloudServers.find(searchObj)
        .skip(pageSize * pageIndex - pageSize)
        .limit(parseInt(pageSize))
        .sort({
          createdTime: "desc",
        })
        .populate("area")
        .populate("server")
        .populate("operatingSystem")
        .populate("order");

      let count = await CloudServers.find(searchObj).countDocuments();
      let totalPages = Math.ceil(count / pageSize);
      let pagedModel = new PagedModel(
        pageIndex,
        pageSize,
        totalPages,
        cloudServer,
        count
      );
      res.json(pagedModel);
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } catch (error) {
    console.log(error);
  }
}

async function insertCloudServer(req, res) {
  try {
    const users = await Socket.findOne({ user: req.userId })
    var dataNow = new Date();
    req.body.code = generateRandomString();
    let cloudServer = new CloudServers(req.body);
    cloudServer.createdTime = Date.now();
    //tính ngày hết hạn
    let server = await Servers.findById(cloudServer.server);
    if (!server) {
      await setActionStatus(req.actionId, `Tạo cloud server`, "fail");
      let response = new ResponseModel(0, "Server not found!", null);
      return res.json(response);
    }
    switch (server.expiryDateType) {
      case 1:
        cloudServer.expiryDate = dataNow.setHours(dataNow.getHours() + 1);
        break;
      case 2:
        cloudServer.expiryDate = dataNow.setDate(dataNow.getDate() + 1);
        break;
      case 3:
        cloudServer.expiryDate = dataNow.setMonth(dataNow.getMonth() + 1);
        break;
      case 4:
        cloudServer.expiryDate = dataNow.setMonth(dataNow.getMonth() + 3);
        break;
      case 5:
        cloudServer.expiryDate = dataNow.setMonth(dataNow.getMonth() + 6);
        break;
      case 6:
        cloudServer.expiryDate = dataNow.setFullYear(dataNow.getFullYear() + 1);
        break;
      default:
        break;
    }
    //trừ tiền khi đăng kí cloud server
    let total;
    let user = await Users.findOne({ _id: req.body.user });
    if (!user) {
      await setActionStatus(req.actionId, `Tạo cloud server`, "fail");
      let response = new ResponseModel(0, "User not found!", null);
      return res.json(response);
    }
    if (server.discount) {
      total = user.surplus - (server.price * server.discount) / 100;
    } else {
      total = user.surplus - server.price;
    }
    if (total < 0) {
      await setActionStatus(req.actionId, `Tạo cloud server`, "fail");
      let response = new ResponseModel(
        0,
        "Tài khoản không đủ vui lòng quý khách nạp tiền vào tài khoản!",
        null
      );
      return res.json(response);
    }
    // lấy ra lịch sử giao dịch gần nhất
    let transactionHistory = await TransactionHistorys.findOne({
      user: req.body.user,
    }).sort({ createdTime: "desc" });
    if (!transactionHistory) {
      await setActionStatus(req.actionId, `Tạo cloud server`, "fail");
      let response = new ResponseModel(
        0,
        "Tài khoản chưa được nạp tiền!",
        null
      );
      return res.json(response);
    }

    const totalPrice = req.body.autoBackup
      ? server.price + server.price * 0.1
      : server.price;
    const order = await Order.create({
      code: generateRandomString(),
      user: req.body.user,
      product: server._id,
      totalPrice: server.discount
        ? (totalPrice * server.discount) / 100
        : totalPrice,
    });

    cloudServer.order = order._id;

    const operatingSystem = await OperatingSystems.findById(req.body.operatingSystem)

    cloudServer.save(async function (err, newCloudServer) {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        await setActionStatus(req.actionId, `Tạo cloud server`, "fail");
        return res.json(response);
      } else {
        await setActionStatus(
          req.actionId,
          `Bắt đầu khởi tạo cloud server ${newCloudServer.code}`,
          "success"
        );
        let response = new ResponseModel(
          1,
          "Create cloud server success!",
          newCloudServer
        );

        const createCloudServer = axios.post('http://mgmt.azshci.vngcloud.com:5000/hyperv/vm', {
          // Memory: server.ram,
          Memory: 1,
          VMName: req.body.cloudServerName,
          MediaPath: operatingSystem.mediaPath,
          SwitchName: "NEXUS3064",
          // NumberOfCPUs: server.cpu, 
          NumberOfCPUs: 2,
          vlan: 1103,
          VMDiskSize: 30,
          // VMDiskSize: server.ssd,
        }).then(async (result) => {
          if (result.data) {
            let time = 0

            let newTransactionHistory = new TransactionHistorys({
              code: generateRandomString(),
              transactionHistoryName: `Đăng kí Cloud Server ${cloudServer.code}`,
              content: `Khởi tạo Cloud Server: Phí duy trì Cloud Server ${cloudServer.code
                } đến ${moment(cloudServer.expiryDate).format(
                  "DD/MM/YYYY hh:mm:ss"
                )}`,
              balanceBeforeTransaction: transactionHistory.balanceAfterTransaction,
              price: transactionHistory.price,
              balanceAfterTransaction: total,
              status: 2,
              user: req.body.user,
              cloudServer: newCloudServer._id,
              createdTime: Date.now(),
            });

            newTransactionHistory.save(async function (
              err,
              newTransactionHistory
            ) {
              if (err) {
                let response = new ResponseModel(-1, err.message, err);
                return res.json(response);
              }
            });
            user.surplus = total;
            _io.to(users.socketId).emit('set surplus', user.surplus);
            let newUser = { updatedTime: Date.now(), ...user };
            let updatedUser = await Users.findOneAndUpdate(
              { _id: req.body.user },
              newUser
            );
            const updateCloudServer = await CloudServers.findByIdAndUpdate(newCloudServer._id, {
              clusterName: result?.data.ClusterName,
              cloudKey: result?.data?.Id,
              password: result?.data.AdminPassword,
              status: 'active'
            })

            _io.to(users.socketId).emit('create cloudserver', {
              id: newCloudServer._id,
              status: 'active'
            })

            if (!updatedUser) {
              await setActionStatus(req.actionId, `Tạo cloud server`, "fail");
              const updateCloudServer = await CloudServers.findByIdAndUpdate(newCloudServer._id, {
                status: 'failed'
              })
              _io.to(users.socketId).emit('create cloudserver', {
                id: newCloudServer._id,
                status: 'failed'
              })
              let response = new ResponseModel(0, "user No found!", null);
              return res.json(response);
            }
            let isSetIp = false
            const waitForIp = setInterval(async () => {
              try {
                
              
              const result_ip = await axios.get(`http://mgmt.azshci.vngcloud.com:5000/hyperv/vm/${result.data.ClusterName}/${result.data.Id}`)
              if (result_ip.data?.[0]?.StatusDescriptions?.includes('Operating normally')) {
                const ip = await Ip.findOne({ status: true })
                if (ip) {
                  try {
                    const class_3 = ip?.ip.split('.')[2]
                    const setIp = await axios.post(`http://mgmt.azshci.vngcloud.com:5000/hyperv/vm/network`, {
                      ClusterName: result.data.ClusterName,
                      VMId: result.data.Id,
                      VMNetwork: {
                        MacAddress: result_ip.data?.[0]?.VMNetwork?.MacAddress,
                        IPConfiguration: {
                          IPAddresses: ip.ip,
                          // IPAddresses: '103.37.61.113',
                          Subnet: "255.255.255.0",
                          // DefaultGateway: class_3 == '61' ? "103.37.61.1" : "103.37.60.1",
                          DefaultGateway:'103.37.61.1',
                          DNSServer: [
                            "1.1.1.1",
                            "8.8.8.8"
                          ]
                        },
                        SwitchName: "NEXUS3064",
                        VlanId: 1103
                      }
                    })
                    if(setIp.data){
                      const updateIpForServer = await CloudServers.findByIdAndUpdate(newCloudServer._id, {
                        ip: ip._id
                      })
                      const updateStatusIp = await Ip.findByIdAndUpdate(ip._id, { status: false })
                      _io.to(users.socketId).emit('set ip success', {
                        id: newCloudServer._id,
                        ip: ip
                      })
                      isSetIp = true
                    }else{
                      _io.to(users.socketId).emit('set ip failed', {
                        id: newCloudServer._id,
                      })
                    }

                  } catch (error) {
                    console.log(error)
                  }
                }
                clearInterval(waitForIp)
              } else {
                if (time == 600000) {
                  if (!isSetIp) {
                    _io.to(users.socketId).emit('set ip failed', {
                      id: newCloudServer._id,
                    })
                  }
                  clearInterval(waitForIp)
                }
              }
            } catch (error) {
                console.log(error)
            }
              time += 60000
            }, 60000)
          } else {
            const updateCloudServer = await CloudServers.findByIdAndUpdate(newCloudServer._id, {
              status: 'failed'
            })
            _io.to(users.socketId).emit('create cloudserver', {
              id: newCloudServer._id,
              status: 'failed'
            })
          }

        }).catch(async error => {
          const updateCloudServer = await CloudServers.findByIdAndUpdate(newCloudServer._id, {
            status: 'failed'
          })
          _io.to(users.socketId).emit('create cloudserver', {
            id: newCloudServer._id,
            status: 'failed'
          })
        })


        let newLog = new Logs({
          code: generateRandomString(),
          logName: "Đăng kí Cloud Server",
          content: `Khởi tạo Cloud Server ${server.ram}/${server.cpu}/${server.ssd}`,
          user: newCloudServer.user,
          cloudServer: newCloudServer._id,
          status: 1,
          completionTime: Date.now(),
        });
        newLog.save(async function (err, newLog) {
          if (err) {
            let response = new ResponseModel(-1, err.message, err);
            res.json(response);
          }
        });

        return res.json(response);
      }
    })
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function updateCloudServer(req, res) {
  try {
    let newCloudServer = { updatedTime: Date.now(), ...req.body };
    let updatedCloudServer = await CloudServers.findOneAndUpdate(
      { _id: req.params.id },
      newCloudServer
    );
    if (!updatedCloudServer) {
      await setActionStatus(req.actionId, `Cập nhật cloud server`, "fail");
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      await setActionStatus(
        req.actionId,
        `Cập nhật cloud server ${updatedCloudServer.code}`,
        "success"
      );
      let response = new ResponseModel(
        1,
        "Update cloud server success!",
        newCloudServer
      );
      res.json(response);
    }
  } catch (error) {
    await setActionStatus(req.actionId, `Cập nhật cloud server`, "fail");
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function deleteCloudServer(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.params.id) {
    try {
      const thisCloudServer = await CloudServers.findById(req.parms.id);
      let cloudServer = await CloudServers.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
        status: 'not-active'
      });
      if (!cloudServer) {
        await setActionStatus(
          req.actionId,
          `Xoá cloud server ${thisCloudServer.code}`,
          "fail"
        );
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        await setActionStatus(
          req.actionId,
          `Xoá cloud server ${thisCloudServer.code}`,
          "success"
        );
        let response = new ResponseModel(
          1,
          "Delete cloud server success!",
          null
        );
        res.json(response);
      }
    } catch (error) {
      await setActionStatus(req.actionId, `Xoá cloud server`, "fail");
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    await setActionStatus(req.actionId, `Xoá cloud server`, "fail");
    res
      .status(404)
      .json(new ResponseModel(404, "cloudServerId is not valid!", null));
  }
}

async function getCloudServerById(req, res) {
  if (req.body.cloudServerId) {
    try {
      let cloudServer = await CloudServers.find({
        _id: req.body.cloudServerId,
        isDeleted: false,
      })
        .populate("area")
        .populate("server")
        .populate("ip")
        .populate("operatingSystem");
      res.json(cloudServer);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "cloudServerId is not valid!", null));
  }
}

async function getPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {
    isDeleted: false,
  };
  if (req.query.search) {
    searchObj = {
      ...searchObj,
      cloudServerName: { $regex: ".*" + req.query.search + ".*" },
    };
  }

  try {
    let cloudServer = await CloudServers.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      })
      .populate("area")
      .populate("server")
      .populate("ip")
      .populate("operatingSystem");

    let count = await CloudServers.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    console.log(count, 'totalPages');
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      cloudServer,
      count
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getDeletedCloudServerByUser(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {
    isDeleted: true,
  };

  if (req.query.search) {
    searchObj.cloudServerName = { $regex: ".*" + req.query.search + ".*" };
  }
  if (req.query.userId) {
    searchObj.user = req.query.userId;
  }
  if (req.query.areaId) {
    searchObj.area = req.query.areaId;
  }
  if (req.query.operatingSystemId) {
    searchObj.operatingSystem = req.query.operatingSystemId;
  }

  try {
    let cloudServer = await CloudServers.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      })
      .populate("area")
      .populate("server")
      .populate("ip")
      .populate("operatingSystem");

    let count = await CloudServers.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      // totalPages,
      cloudServer,
      count
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getCloudServerByUserId(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;
  let searchObj = {
    isDeleted: {
      $ne: true,
    },
    expiryDate: {
      $gt: new Date(),
    },
  };
  if (req.query.search) {
    searchObj.cloudServerName = { $regex: ".*" + req.query.search + ".*" };
  }
  if (req.query.userId) {
    searchObj.user = req.query.userId;
  }
  if (req.query.areaId) {
    searchObj.area = req.query.areaId;
  }
  if (req.query.operatingSystemId) {
    searchObj.operatingSystem = req.query.operatingSystemId;
  }

  try {
    let cloudServer = await CloudServers.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      })
      .populate("area")
      .populate("server")
      .populate("ip")
      .populate("operatingSystem")
      .populate("order");

    let count = await CloudServers.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      cloudServer,
      count
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getCloudServerDelete(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  searchObj.isShow = false;
  if (req.query.search) {
    searchObj.cloudServerName = { $regex: ".*" + req.query.search + ".*" };
  }
  if (req.query.userId) {
    searchObj.user = req.query.userId;
  }

  try {
    let cloudServer = await CloudServers.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      })
      .populate("area")
      .populate("server")
      .populate("ip")
      .populate("operatingSystem");

    let count = await CloudServers.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      cloudServer,
      count
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getCloudServerExpiresPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj.cloudServerName = { $regex: ".*" + req.query.search + ".*" };
  }
  if (req.query.userId) {
    searchObj.user = req.query.userId;
  }

  try {
    let cloudServer = await CloudServers.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      })
      .populate("area")
      .populate("server")
      .populate("ip")
      .populate("operatingSystem");

    let dateNow = new Date();
    let resCloudServer = [];

    if (cloudServer.length > 0) {
      cloudServer.forEach((item) => {
        // tính thời gian gần kết thúc (regulationDate)
        let expiryDateFormat = new Date(item.expiryDate);
        let regulationDate;
        switch (item.server.expiryDateType) {
          case 1:
            // gói giờ luôn thông báo là sắp hết hạn
            resCloudServer.push(item);
            break;
          case 2:
            // gói ngày luôn thông báo là sắp hết hạn
            resCloudServer.push(item);
            break;
          case 3:
            // gói 1 tháng nếu còn 10 ngày thì sẽ báo  sắp hết hạn
            regulationDate = expiryDateFormat.setDate(
              expiryDateFormat.getDate() - 10
            );
            if (dateNow >= regulationDate) {
              resCloudServer.push(item);
            }
            break;
          case 4:
            // gói 3 tháng nếu còn 1 tháng thì sẽ báo  sắp hết hạn
            regulationDate = expiryDateFormat.setDate(
              expiryDateFormat.getMonth() - 1
            );
            if (dateNow >= regulationDate) {
              resCloudServer.push(item);
            }
            break;
          case 5:
            // gói 6 tháng nếu còn 2 tháng thì sẽ báo  sắp hết hạn
            regulationDate = expiryDateFormat.setDate(
              expiryDateFormat.getMonth() - 2
            );
            if (dateNow >= regulationDate) {
              resCloudServer.push(item);
            }
            break;
          case 6:
            // gói 12 tháng nếu còn 3 tháng thì sẽ báo  sắp hết hạn
            regulationDate = expiryDateFormat.setDate(
              expiryDateFormat.getMonth() - 3
            );
            if (dateNow >= regulationDate) {
              resCloudServer.push(item);
            }
            break;
          default:
            break;
        }
      });
    }

    let totalPages = resCloudServer.length;
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      resCloudServer,
      cloudServer.length
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function cloudServerExtend(req, res) {
  try {
    const users = await Socket.findOne({ user: req.userId })

    //pram
    // id
    // totalPrice ="49000"
    // month= 1
    var dataNow = new Date();
    let cloudServer = await CloudServers.findById(req.params.id);

    if (cloudServer) {
      //kiểm tra số dư tài khoản còn đủ hay không
      let user = await Users.findOne({ _id: cloudServer.user });
      let total = Number(Number(user.surplus) - Number(req.body.totalPrice));
      if (total < 0) {
        let response = new ResponseModel(
          0,
          "Tài khoản không đủ vui lòng quý khách nạp tiền vào tài khoản!",
          null
        );
        return res.json(response);
      }
      //câp nhật giá cho hóa đơn
      let order = await Order.findById(cloudServer.order);
      if (!order) {
        let response = new ResponseModel(0, "Order not found!", null);
        return res.json(response);
      }
      let newOrder = {
        updatedTime: Date.now(),
        totalPrice: Number(order.totalPrice) + Number(req.body.totalPrice),
      };
      let updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id },
        newOrder
      );
      if (!updatedOrder) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      }
      //tính ngày hêt  hạn của cloud
      console.log(new Date(cloudServer.expiryDate).getTime() + req.body.time);
      cloudServer.expiryDate = new Date(
        new Date(cloudServer.expiryDate).getTime() + req.body.time
      );
      let newCloudServer = { updatedTime: Date.now(), ...cloudServer };
      let updatedCloudServer = await CloudServers.findOneAndUpdate(
        { _id: req.params.id },
        newCloudServer
      );
      if (!updatedCloudServer) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        //update số dư tài khoản
        user.surplus = total;
        _io.to(users.socketId).emit("set surplus", user.surplus);
        let newUser = { updatedTime: Date.now(), ...user };
        let updatedUser = await Users.findOneAndUpdate(
          { _id: user._id },
          newUser
        );
        if (!updatedUser) {
          let response = new ResponseModel(0, "user No found!", null);
          res.json(response);
        }
        //lấy ra lịch sử thanh toán mới nhất
        let transactionHistory = await TransactionHistorys.findOne({
          user: user._id,
        }).sort({ createdTime: "desc" });
        if (!transactionHistory) {
          let response = new ResponseModel(
            0,
            "Tài khoản chưa được nạp tiền!",
            null
          );
          return res.json(response);
        }
        //thêm lịch sử thanh toán
        let newTransactionHistory = new TransactionHistorys({
          code: generateRandomString(),
          transactionHistoryName: `Gia hạn Cloud Server ${cloudServer.code}`,
          content: `Gia hạn Cloud Server: Phí duy trì Cloud Server ${cloudServer.code
            } đến ${moment(dataNow).format("DD/MM/YYYY hh:mm:ss")}`,
          balanceBeforeTransaction: transactionHistory.balanceAfterTransaction,
          price: transactionHistory.price,
          balanceAfterTransaction: total,
          status: 2,
          user: req.body.user,
          cloudServer: cloudServer._id,
          createdTime: Date.now(),
        });
        await newTransactionHistory.save(async function (
          err,
          newTransactionHistory
        ) {
          if (err) {
            let response = new ResponseModel(-1, err.message, err);
            res.json(response);
          }
        });
        // thêm log khi tạo cloud
        // let newLog = new Logs({
        //   code: generateRandomString(),
        //   logName: "Gia hạn Cloud Server",
        //   content: `Gia hạn Cloud Server ${server.ram}/${server.cpu}/${server.ssd}`,
        //   user: user._id,
        //   cloudServer: cloudServer._id,
        //   status: 1,
        //   completionTime:  Date.now(),
        // });
        // await newLog.save(async function (err, newLog) {
        //   if (err) {
        //     let response = new ResponseModel(-1, err.message, err);
        //     res.json(response);
        //   }
        // })
        let response = new ResponseModel(
          1,
          "successful extension",
          updatedCloudServer
        );
        res.json(response);
      }
    } else {
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    }
  } catch (error) {
    console.log(error);
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function cloudServerUpgradec(req, res) {
  try {
    const users = await Socket.findOne({ user: req.userId })
    //pram
    // id
    // serverId
    var dataNow = new Date();
    let server = await Servers.findById(req.body.server);
    if (!server) {
      let response = new ResponseModel(0, "Server not found!", null);
      return res.json(response);
    }

    let cloudServer = await CloudServers.findById(req.params.id);
    if (cloudServer) {
      //tính ngày  hết hạn
      switch (server.expiryDateType) {
        case 1:
          cloudServer.expiryDate = dataNow.setHours(dataNow.getHours() + 1);
          break;
        case 2:
          cloudServer.expiryDate = dataNow.setDate(dataNow.getDate() + 1);
          break;
        case 3:
          cloudServer.expiryDate = dataNow.setMonth(dataNow.getMonth() + 1);
          break;
        case 4:
          cloudServer.expiryDate = dataNow.setMonth(dataNow.getMonth() + 3);
          break;
        case 5:
          cloudServer.expiryDate = dataNow.setMonth(dataNow.getMonth() + 6);
          break;
        case 6:
          cloudServer.expiryDate = dataNow.setFullYear(
            dataNow.getFullYear() + 1
          );
          break;
        default:
          break;
      }
      //kiểm tra số dư tài khoản còn đủ hay không
      let user = await Users.findOne({ _id: cloudServer.user });
      if (!user) {
        let response = new ResponseModel(0, "user not found!", null);
        return res.json(response);
      }
      let total = user.surplus - server.price;
      if (total < 0) {
        let response = new ResponseModel(
          0,
          "Tài khoản không đủ vui lòng quý khách nạp tiền vào tài khoản!",
          null
        );
        return res.json(response);
      }
      //câp nhật giá cho hóa đơn
      const order = await Order.create({
        code: generateRandomString(),
        user: user._id,
        product: cloudServer._id,
        totalPrice: Number(
          server.discount
            ? (server.price * server.discount) / 100
            : server.price
        ),
      });
      cloudServer.order = order._id;
      //tính ngày hêt  hạn của cloud
      cloudServer.server = server._id;
      let newCloudServer = { updatedTime: Date.now(), ...cloudServer };
      let updatedCloudServer = await CloudServers.findOneAndUpdate(
        { _id: req.params.id },
        newCloudServer
      );
      if (!updatedCloudServer) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        //update số dư tài khoản
        user.surplus = total;
        _io.to(users.socketId).emit("set surplus", user.surplus);
        let newUser = { updatedTime: Date.now(), ...user };
        let updatedUser = await Users.findOneAndUpdate(
          { _id: user._id },
          newUser
        );
        if (!updatedUser) {
          let response = new ResponseModel(0, "user No found!", null);
          res.json(response);
        }
        //lấy ra lịch sử thanh toán mới nhất
        let transactionHistory = await TransactionHistorys.findOne({
          user: user._id,
        }).sort({ createdTime: "desc" });
        if (!transactionHistory) {
          let response = new ResponseModel(
            0,
            "Tài khoản chưa được nạp tiền!",
            null
          );
          return res.json(response);
        }
        //thêm lịch sử thanh toán
        let newTransactionHistory = new TransactionHistorys({
          code: generateRandomString(),
          transactionHistoryName: `Nâng cấp Cloud Server ${cloudServer.code}`,
          content: `Nâng cấp Cloud Server: Phí duy trì Cloud Server ${cloudServer.code
            } đến ${moment(dataNow).format("DD/MM/YYYY hh:mm:ss")}`,
          balanceBeforeTransaction: transactionHistory.balanceAfterTransaction,
          price: transactionHistory.price,
          balanceAfterTransaction: total,
          status: 2,
          user: user._id,
          cloudServer: cloudServer._id,
          createdTime: Date.now(),
        });
        await newTransactionHistory.save(async function (
          err,
          newTransactionHistory
        ) {
          if (err) {
            let response = new ResponseModel(-1, err.message, err);
            res.json(response);
          }
        });
        // thêm log khi tạo cloud
        let newLog = new Logs({
          code: generateRandomString(),
          logName: "Gia hạn Cloud Server",
          content: `Gia hạn Cloud Server ${server.ram}/${server.cpu}/${server.ssd}`,
          user: user._id,
          cloudServer: cloudServer._id,
          status: 1,
          completionTime: Date.now(),
        });
        await newLog.save(async function (err, newLog) {
          if (err) {
            let response = new ResponseModel(-1, err.message, err);
            res.json(response);
          }
        });
        let response = new ResponseModel(
          1,
          "successful extension",
          updatedCloudServer
        );
        res.json(response);
      }
    } else {
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    }
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function autoRenewCloudServer() {
  const cron = "0 0 * * *";
  try {
    const job = schedule.scheduleJob(cron, async function () {
      const cloudServer = await CloudServers.find({
        expiryDate: {
          $lte: new Date(),
        },
        isAutoRenew: true,
        isDeleted: {
          $ne: true,
        },
      }).populate("server");
      const checkAndRenew = await Promise.all(
        cloudServer.map(async (item) => {
          if (item) {
            //kiểm tra số dư tài khoản còn đủ hay không
            let user = await Users.findOne({ _id: item.user });
            let total = Number(
              Number(user.surplus) - Number(item.server?.price)
            );
            if (total < 0) {
              createNotification(
                user._id,
                `Tự động gia hạn cloud server`,
                "shopping",
                `Tự động gia hạn cloud server ${item.cloudServerName} không thành công, số dư không đủ`
              );
            }
            //câp nhật giá cho hóa đơn
            let order = await Order.findById(item.order);
            if (!order) {
              createNotification(
                user._id,
                `Tự động gia hạn cloud server`,
                "shopping",
                `Tự động gia hạn cloud server ${item.cloudServerName} không thành công, không tìm thấy hoá đơn`
              );
            }
            let newOrder = {
              updatedTime: Date.now(),
              totalPrice:
                Number(order?.totalPrice) + Number(item.server?.price),
            };
            let updatedOrder = await Order.findOneAndUpdate(
              { _id: order._id },
              newOrder
            );
            if (!updatedOrder) {
              createNotification(
                user._id,
                `Tự động gia hạn cloud server`,
                "shopping",
                `Tự động gia hạn cloud server ${item.cloudServerName} không thành công, không tìm thấy hoá đơn`
              );
            }
            //tính ngày hêt  hạn của cloud
            cloudServer.expiryDate = new Date(
              new Date(item.expiryDate).getTime() +
              expiryDateTypeToNumber(item.server?.expiryDateType)
            );

            let newCloudServer = { updatedTime: Date.now(), ...cloudServer };
            let updatedCloudServer = await CloudServers.findOneAndUpdate(
              { _id: item._id },
              newCloudServer
            );
            if (!updatedCloudServer) {
              createNotification(
                user._id,
                `Tự động gia hạn cloud server`,
                "shopping",
                `Tự động gia hạn cloud server ${item.cloudServerName} không thành công, không tìm thấy cloud server`
              );
            } else {
              //update số dư tài khoản
              user.surplus = total;
              const socket = await Socket.findOne({
                user: user._id
              })
              _io.to(socket.socketId).emit("set surplus", user.surplus);
              let newUser = { updatedTime: Date.now(), ...user };
              let updatedUser = await Users.findOneAndUpdate(
                { _id: user._id },
                newUser
              );
              if (!updatedUser) {
                createNotification(
                  user._id,
                  `Tự động gia hạn cloud server`,
                  "shopping",
                  `Tự động gia hạn cloud server ${item.cloudServerName} không thành công, không tìm thấy người dùng`
                );
                res.json(response);
              }

              //lấy ra lịch sử thanh toán mới nhất
              let transactionHistory = await TransactionHistorys.findOne({
                user: user._id,
              }).sort({ createdTime: "desc" });
              if (!transactionHistory) {
                createNotification(
                  user._id,
                  `Tự động gia hạn cloud server`,
                  "shopping",
                  `Tự động gia hạn cloud server ${item.cloudServerName} không thành công, tài khoản chưa được nạp tiền`
                );
              }
              //thêm lịch sử thanh toán
              let newTransactionHistory = new TransactionHistorys({
                code: generateRandomString(),
                transactionHistoryName: `Gia hạn Cloud Server ${item.code}`,
                content: `Gia hạn Cloud Server ${item.code}`,
                balanceBeforeTransaction:
                  transactionHistory.balanceAfterTransaction,
                price: transactionHistory.price,
                balanceAfterTransaction: total,
                status: 2,
                user: item.user,
                cloudServer: item._id,
                createdTime: Date.now(),
              });
              newTransactionHistory.save(async function (
                err,
                newTransactionHistory
              ) {
                if (err) {
                  let response = new ResponseModel(-1, err.message, err);
                  res.json(response);
                }
              });
              createNotification(
                user._id,
                `Tự động gia hạn cloud server`,
                "shopping",
                `Tự động gia hạn cloud server ${item.cloudServerName} thành công`
              );
            }
          }
        })
      );
    });
  } catch (error) {
    console.log(error);
  }
}

async function autoExpiredServer() {
  const cron = "0 0 * * *";
  try {
    const job = schedule.scheduleJob(cron, async function () {
      const cloudServer = await CloudServers.updateMany({
        expiryDate: {
          $lte: new Date(),
        },
        isAutoRenew: false,
        isDeleted: {
          $ne: true,
        },
      }, { status: 'expired' })
    });
  } catch (error) {
    console.log(error);
  }
}

async function notifyCloudServerAboutToExpire() {
  const cron = "0 0 * * *";
  try {
    const job = schedule.scheduleJob(cron, async function () {
      const cloudServer = await CloudServers.find({
        expiryDate: {
          $lte: new Date(new Date().setDate(new Date().getDate() + 3)),
        },
        isDeleted: {
          $ne: true,
        },
      });

      const notifyArray = await Promise.all(
        cloudServer.map(async (item) => {
          createNotification(
            item.user,
            `Cloud server sắp hết hạn`,
            "shopping",
            ` Cloud Server ${item.cloudServerName} sắp hết hạn`
          );
        })
      );
    });
  } catch (error) {
    console.log(error);
  }
}
async function updateNameCloudById(req, res) {
  try {
    let newCloudServer = { updatedTime: Date.now(), ...req.body };
    let updatedCloudServer = await CloudServers.findOneAndUpdate(
      { _id: req.params.id },
      newCloudServer
    );
    if (!updatedCloudServer) {
      await setActionStatus(
        req.actionId,
        `Thay đổi tên cloud server ${req.body.code}`,
        "fail"
      );
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      await setActionStatus(
        req.actionId,
        `Thay đổi tên cloud server ${req.body.code}`,
        "success"
      );
      let response = new ResponseModel(
        1,
        "Update cloud server success!",
        newCloudServer
      );
      res.json(response);
    }
  } catch (error) {
    await setActionStatus(
      req.actionId,
      `Thay đổi tên cloud server ${req.body.code}`,
      "fail"
    );
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}
//get by id
async function getCloudServersById(req, res) {
  const { id } = req.params;
  const result = await CloudServers.findById(id)
    .populate("area")
    .populate("server")
    .populate("operatingSystem")
    .populate("ip")
    .populate("order");
  let response = new ResponseModel(200, `OKE`, result);
  res.status(200).json(response);
}
async function updateDataOfServerInCloudServerById(req, res) {
  const { id } = req.params;
  const { price } = req.body;

  try {
    const result = await CloudServers.findByIdAndUpdate(id, {
      server: req.body?._id,
    });
    if (result) {
      const updateOrderById = await Order.findByIdAndUpdate(result?.order, {
        product: result?.server,
        totalPrice: price,
        updatedAt: Date.now(),
      });
      let response = new ResponseModel(1, "Upgrade success!", result);
      res.status(200).json(response);
    }
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }

  // const order = await Order.create({
  //   code: generateRandomString(),
  //   user: req.body.user,
  //   product: server._id,
  //   totalPrice: server.discount
  //     ? (server.price * server.discount) / 100
  //     : server.price,
  // });

  // cloudServer.order = order._id;
}
exports.notifyCloudServerAboutToExpire = notifyCloudServerAboutToExpire;
exports.autoRenewCloudServer = autoRenewCloudServer;
exports.insertCloudServer = insertCloudServer;
exports.updateCloudServer = updateCloudServer;
exports.deleteCloudServer = deleteCloudServer;
exports.getCloudServerById = getCloudServerById;
exports.getPaging = getPaging;
exports.getCloudServerByUserId = getCloudServerByUserId;
exports.getCloudServerDelete = getCloudServerDelete;
exports.getCloudServerExpiresPaging = getCloudServerExpiresPaging;
exports.cloudServerExtend = cloudServerExtend;
exports.cloudServerUpgradec = cloudServerUpgradec;
exports.switchAutoRenewServer = switchAutoRenewServer;
exports.softDeleteCloudServer = softDeleteCloudServer;
exports.getDeletedCloudServerByUser = getDeletedCloudServerByUser;
exports.getAboutToExpireCloudServer = getAboutToExpireCloudServer;
exports.updateNameCloudById = updateNameCloudById;
//
exports.getCloudServersById = getCloudServersById;
exports.updateDataOfServerInCloudServerById =
  updateDataOfServerInCloudServerById;
exports.autoExpiredServer = autoExpiredServer