const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const OperatingSystems = require("../../database/entities/OperatingSystems");
const path = require("path");
const generateRandomString = require("../../helpers/generateRandomString");
const { setActionStatus } = require("../routes/actionMiddleWare");

async function initOperatingSystem(req, res){
  try {
    const data = await fetch('http://mgmt.azshci.vngcloud.com:5000/hyperv/media')
    const result = await data.json()
    if(result){
      const returnRes = result.filter(item => item.MediaPath?.includes('vhdx') || item.MediaPath?.includes('VHDx'))
      const newOp = await Promise.all(returnRes.map(async (item)=> {
        let operatingSystemParentName = 'Centos'
        if(item.Name?.toLowerCase().includes('windows'))
          operatingSystemParentName = 'Window'
        else if(item.Name?.toLowerCase().includes('debian'))
          operatingSystemParentName = 'Debian'
        else if(item.Name?.toLowerCase().includes('ubuntu'))
          operatingSystemParentName = 'Ubuntu'

        const parentOperatingSystem = await OperatingSystems.findOne({operatingSystemName: operatingSystemParentName})

        return await OperatingSystems.create({
          code: generateRandomString(),
          operatingSystemName: item.Name?.replace('H2-G2', '').replace('-G2',''),
          mediaPath: item.MediaPath,
          createdTime: new Date(),
          parentID: parentOperatingSystem._id
        })
      }))
      return res.status(200).json({newOperatingSystem: newOp})
    }
    return res.status(404).json({message: 'Not found any operating system'})
  } catch (error) {
    console.log(error)
    return res.status(500).json({message: 'Failed'})
  }
}

async function insertOperatingSystem(req, res) {
  // if (req.actions.includes("insertOperatingSystem")) {
    try {
      if (req.files?.file) {
        const file = req.files.file;
        file.mv(
          path.join(__dirname, `../../public/UploadFiles/${file.name}`),
          (err) => {
            console.log(err);
          }
        );
      }
      let operatingSystem = new OperatingSystems({
        operatingSystemName: req.body.operatingSystemName,
        parentID: req.body.parentID,
        file: `${process.env.URL}/UploadFiles/${req.files?.file?.name}`,
        code: generateRandomString(),
      });
      operatingSystem.createdTime = Date.now();

      operatingSystem.save(async function (err, newOperatingSystem) {
        if (err) {
          console.log(err)
          let response = new ResponseModel(-1, err.message, err);
          await setActionStatus(req.actionId, `T???o h??? ??i???u h??nh`, 'fail')
          return res.status(201).json(response);
        } else {
          let response = new ResponseModel(
            1,
            "Create operating system success!",
            newOperatingSystem
          );
          await setActionStatus(req.actionId, `T???o h??? ??i???u h??nh ${newOperatingSystem.code}`, 'success')
          res.json(response);
        }
      });
    } catch (error) {
      console.log(error)
      await setActionStatus(req.actionId, `T???o h??? ??i???u h??nh`, 'fail')
      let response = new ResponseModel(404, error.message, error);
      res.json(response)
    }
  // } else {
  //   await setActionStatus(req.actionId, `T???o h??? ??i???u h??nh`, 'fail')
  //   return res.status(403);
  // }
}
async function updateOperatingSystem(req, res) {
  // if (req.actions.includes("updateOperatingSystem")) {
    try {
      if (req.files?.file) {
        const file = req.files?.file;
        file.mv(
          path.join(__dirname, `../../public/UploadFiles/${file.name}`),
          (err) => {
            console.log(err);
          }
        );
      }
      let newOperatingSystem = {
        updatedTime: Date.now(),
        file: req.files?.file?.name,
        ...req.body,
      };
      let updatedOperatingSystem = await OperatingSystems.findOneAndUpdate(
        { _id: req.params.id },
        newOperatingSystem
      );
      if (!updatedOperatingSystem) {
        await setActionStatus(req.actionId, `C???p nh???t h??? ??i???u h??nh ${updatedOperatingSystem.code}`, 'fail')
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        await setActionStatus(req.actionId, `C???p nh???t h??? ??i???u h??nh ${updatedOperatingSystem.code}`, 'success')
        let response = new ResponseModel(
          1,
          "Update operating system success!",
          newOperatingSystem
        );
        res.json(response);
      }
    } catch (error) {
      console.log(error);
      await setActionStatus(req.actionId, `C???p nh???t h??? ??i???u h??nh`, 'fail')
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  // } else {
  //   await setActionStatus(req.actionId, `C???p nh???t h??? ??i???u h??nh ${req.body.code}`, 'fail')
  //   return res.status(403);
  // }
}

async function deleteOperatingSystem(req, res) {
  // if (isValidObjectId(req.params.id)) {
  // if (req.actions.includes("deleteOperatingSystem")) {
    if (req.params.id) {
      try {
        const thisOperatingSystem = await OperatingSystems.findById(req.params.id)
        let operatingSystem = await OperatingSystems.findByIdAndDelete(
          req.params.id
        );
        if (!operatingSystem) {
          await setActionStatus(req.actionId, `Xo?? h??? ??i???u h??nh ${thisOperatingSystem.code}`, 'fail')
          let response = new ResponseModel(0, "No item found!", null);
          res.json(response);
        } else {
          await setActionStatus(req.actionId, `Xo?? h??? ??i???u h??nh ${thisOperatingSystem.code}`, 'success')
          let response = new ResponseModel(
            1,
            "Delete operating system success!",
            null
          );
          res.json(response);
        }
      } catch (error) {
        await setActionStatus(req.actionId, `Xo?? h??? ??i???u h??nh`, 'fail')
        let response = new ResponseModel(404, error.message, error);
        res.status(404).json(response);
      }
    } else {
      await setActionStatus(req.actionId, `Xo?? h??? ??i???u h??nh`, 'fail')
      res
        .status(404)
        .json(new ResponseModel(404, "OperatingSystemId is not valid!", null));
    }
  // } else {
  //   await setActionStatus(req.actionId, `Xo?? h??? ??i???u h??nh`, 'fail')
  //   res.sendStatus(403);
  // }
}

async function getOperatingSystemById(req, res) {
  if (req.body.operatingSystemId) {
    try {
      let operatingSystem = await OperatingSystems.findById(
        req.body.operatingSystemId
      );
      res.json(operatingSystem);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "operatingSystemId is not valid!", null));
  }
}

async function getPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = {
      operatingSystemName: { $regex: ".*" + req.query.search + ".*" },
    };
  }
  try {
    let operatingSystem = await OperatingSystems.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });
    const returnArray = operatingSystem.map((item) => {
      if (item.parentID) {
        console.log(item);
        const parent = operatingSystem.find((x) => {
          return x._id.toString() == item.parentID;
        });
        const newItem = {
          ...item._doc,
          parentName: parent?.operatingSystemName,
        };
        return newItem;
      }
      return item;
    });

    let count = await OperatingSystems.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      returnArray,
      count
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
    console.log(error);
  }
}

async function getOperatingSystem(req, res) {
  let pageSize = req.query.pageSize || 100;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = {
      operatingSystemName: { $regex: ".*" + req.query.search + ".*" },
    };
  }
  try {
    let operatingSystem = await OperatingSystems.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

    const returnArray = operatingSystem.map((item) => {
      if (item.parentID) {
        const parent = operatingSystem.find((x) => x._id == item.parentID);
        const newItem = {
          ...item._doc,
          parentName: parent.operatingSystemName,
        };
        return newItem;
      }
      return item;
    });

    let count = await OperatingSystems.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      returnArray,
      count
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getOperatingSystemChildren(req, res) {
  let pageSize = req.query.pageSize || 100;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = {
      operatingSystemName: { $regex: ".*" + req.query.search + ".*" },
    };
  }
  try {
    let operatingSystem = await OperatingSystems.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });
    let resData = [];
    operatingSystem.map((item) => {
      if (!item.parentID) {
        let dataChildren = operatingSystem.filter(
          (x) => x.parentID == item._id
        );
        let data = {
          _id: item._id,
          operatingSystemName: item.operatingSystemName,
          img: item.img,
          file: item.file,
          createdTime: item.createdTime,
          children: dataChildren,
        };
        resData.push(data);
      }
    });

    let count = await OperatingSystems.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, resData);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

exports.insertOperatingSystem = insertOperatingSystem;
exports.updateOperatingSystem = updateOperatingSystem;
exports.deleteOperatingSystem = deleteOperatingSystem;
exports.getOperatingSystemById = getOperatingSystemById;
exports.getOperatingSystem = getOperatingSystem;
exports.getOperatingSystemChildren = getOperatingSystemChildren;
exports.getPaging = getPaging;
exports.initOperatingSystem = initOperatingSystem
