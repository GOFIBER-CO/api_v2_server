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

async function switchAutoRenewServer(req, res) {
  try {
    const id = req.params.id;
    const result = await CloudServers.findByIdAndUpdate(id, {
      isAutoRenew: req.body.isAutoRenew,
    });
    return res.status(200).json({
      message: req.body.isAutoRenew
        ? "Cloud server sẽ tự gia hạn"
        : "Cloud server sẽ không tự gia hạn",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
}

async function softDeleteCloudServer(req, res) {
  try {
    const result = await CloudServers.findByIdAndUpdate(req.params?.id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    return res.status(200).json({ message: "Huỷ cloud server thành công" });
  } catch (error) {
    console.log(error);
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
        totalPages < 10 ? 10 : totalPages,
        cloudServer,
        count< 99 ? 150 : count
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
  console.log(req.body);
  try {
    var dataNow = new Date();
    req.body.code = generateRandomString();
    let cloudServer = new CloudServers(req.body);
    cloudServer.createdTime = Date.now();
    //tính ngày hết hạn
    let server = await Servers.findById(cloudServer.server);
    if (!server) {
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
      let response = new ResponseModel(0, "User not found!", null);
      return res.json(response);
    }
    if (server.discount) {
      total = user.surplus - (server.price * server.discount) / 100;
    } else {
      total = user.surplus - server.price;
    }
    if (total < 0) {
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
      let response = new ResponseModel(
        0,
        "Tài khoản chưa được nạp tiền!",
        null
      );
      return res.json(response);
    }
    //câp nhật tiền của user
    user.surplus = total;
    _io.emit("set surplus", user.surplus);
    let newUser = { updatedTime: Date.now(), ...user };
    let updatedUser = await Users.findOneAndUpdate(
      { _id: req.body.user },
      newUser
    );
    if (!updatedUser) {
      let response = new ResponseModel(0, "user No found!", null);
      res.json(response);
    }
    //tạo hóa đơn
    const order = await Order.create({
      code: generateRandomString(),
      user: req.body.user,
      product: server._id,
      totalPrice: server.discount
        ? (server.price * server.discount) / 100
        : server.price,
    });

    cloudServer.order = order._id;

    cloudServer.save(async function (err, newCloudServer) {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        res.json(response);
      } else {
        let response = new ResponseModel(
          1,
          "Create cloud server success!",
          newCloudServer
        );
        // thêm id cloud đã đăng kí vào lịch sử thành toán
        let newTransactionHistory = new TransactionHistorys({
          code: generateRandomString(),
          transactionHistoryName: `Đăng kí Cloud Server ${cloudServer.code}`,
          content: `Khởi tạo Cloud Server: Phí duy trì Cloud Server ${
            cloudServer.code
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
          logName: "Đăng kí Cloud Server",
          content: `Khởi tạo Cloud Server ${server.ram}/${server.cpu}/${server.ssd}`,
          user: newCloudServer.user,
          cloudServer: newCloudServer._id,
          status: 1,
          completionTime: Date.now(),
        });
        await newLog.save(async function (err, newLog) {
          if (err) {
            let response = new ResponseModel(-1, err.message, err);
            res.json(response);
          }
        });

        res.json(response);
      }
    });
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
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      let response = new ResponseModel(
        1,
        "Update cloud server success!",
        newCloudServer
      );
      res.json(response);
    }
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function deleteCloudServer(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.params.id) {
    try {
      let cloudServer = await CloudServers.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
      });
      if (!cloudServer) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        let response = new ResponseModel(
          1,
          "Delete cloud server success!",
          null
        );
        res.json(response);
      }
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
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
      .populate("operatingSystem");

    let count = await CloudServers.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    console.log(count,'totalPages');
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
      .populate("operatingSystem");

    let count = await CloudServers.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages < 10 ? 10 : totalPages,
      // totalPages,
      cloudServer,
      count< 99 ? 150 : count
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
      .populate("operatingSystem")
      .populate("order");

    let count = await CloudServers.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex ,
      pageSize,
      totalPages < 10 ? 10 : totalPages,
      cloudServer,
      count< 99 ? 150 : count
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
        _io.emit("set surplus", user.surplus);
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
          content: `Gia hạn Cloud Server: Phí duy trì Cloud Server ${
            cloudServer.code
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
        _io.emit("set surplus", user.surplus);
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
          content: `Nâng cấp Cloud Server: Phí duy trì Cloud Server ${
            cloudServer.code
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
            console.log(order);
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
              _io.emit("set surplus", user.surplus);
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
  console.log(`req.body`, req.body, req.params);
  try {
    let newCloudServer = { updatedTime: Date.now(), ...req.body };
    let updatedCloudServer = await CloudServers.findOneAndUpdate(
      { _id: req.params.id },
      newCloudServer
    );
    if (!updatedCloudServer) {
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      let response = new ResponseModel(
        1,
        "Update cloud server success!",
        newCloudServer
      );
      res.json(response);
    }
  } catch (error) {
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
    .populate("order");
  // console.log("result: ", result);
  let response = new ResponseModel(200, `OKE`, result);
  res.status(200).json(response);
}
async function updateDataOfServerInCloudServerById(req, res) {
  console.log(`hahahah`, req.body, req.params);
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
exports.updateDataOfServerInCloudServerById = updateDataOfServerInCloudServerById;
