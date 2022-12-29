const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const VMConfig = require("../../database/entities/VmConfig");

async function insertVmConfig(req, res) {
  try {
    const vmConfig = new VMConfig(req.body);
    vmConfig.createdTime = Date.now();
    vmConfig.save((err, newVmConfig) => {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        res.json(response);
      } else {
        let response = new ResponseModel(
          1,
          "Create VMConfig success!",
          newVmConfig
        );
        res.json(response);
      }
    });
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}
async function deleteVmConfig(req, res) {
  const { id } = req.params;
  // console.log('id: ', id);
  if (id) {
    try {
      let noti = await VMConfig.findByIdAndDelete(id);

      if (!noti) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Delete VmConfig success!", null);
        res.json(response);
      }
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "VMConfig is not valid!", null));
  }
}
async function updateVmConfig(req, res) {
  console.log(req.params.id);
  // return
  try {
    const newVmConfig = { ...req.body, updatedTime: Date.now() };
    const updatedVmConfig = await VMConfig.findByIdAndUpdate(
      { _id: req.params.id },
      newVmConfig
    );
    if (!updatedVmConfig) {
      let response = new ResponseModel(
        0,
        "Update VmConfig not  success!",
        null
      );
      res.json(response);
    } else {
      let response = new ResponseModel(
        0,
        "Update VmConfig success!",
        updatedVmConfig
      );
      res.json(response);
    }
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}
async function getByVmConfigById(req, res) {
  const { id } = req.params;
  try {
    const vmConfig = await VMConfig.findById(id);
    res.json(vmConfig);
  } catch (error) {
    let response = new ResponseModel(-2, error.message, error);
    res.json(response);
  }
}
async function getPagingVmConfig(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    // searchObj = { areaName: { $regex: ".*" + req.query.search + ".*" } };
  }
  try {
    const vmConfig = await VMConfig.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });
    let count = await VMConfig.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      vmConfig,
      count
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

exports.insertVmConfig = insertVmConfig;
exports.deleteVmConfig = deleteVmConfig;
exports.updateVmConfig = updateVmConfig;
exports.getByVmConfigById = getByVmConfigById;
exports.getPagingVmConfig = getPagingVmConfig;
