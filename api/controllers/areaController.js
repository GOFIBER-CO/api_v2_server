const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const Areas = require("../../database/entities/Areas");
const path = require('path')
const generateRandomString = require("../../helpers/generateRandomString");
const { setActionStatus } = require("../routes/actionMiddleWare");

async function insertArea(req, res) {
  if (req.actions.includes("insertArea")) {
    try {
      if(req.files?.file){
        const file = req.files.file
        file.mv( path.join(__dirname, `../../public/UploadFiles/${file.name}`), (err) => {
          console.log(err)
        })
      }
      req.body.code = generateRandomString()
      let area = new Areas({file: `${process.env.URL}/UploadFiles/${req.files?.file?.name}`, ...req.body});
      area.createdTime = Date.now();
      area.save(async function (err, newArea) {
        if (err) {
          let response = new ResponseModel(-1, err.message, err);
          await setActionStatus(req.actionId, `Tạo khu vực thất bại`, 'fail')
          return res.json(response);
        } else {
          let response = new ResponseModel(
            1,
            "Create area success!",
            newArea
          );
          await setActionStatus(req.actionId, `Tạo thành công khu vực ${newArea.code}`, 'success')
          return res.json(response);
        }
      });
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      await setActionStatus(req.actionId, `Tạo khu vực thất bại`, 'fail')
      return res.status(404).json(response);
    }
  } else {
    await setActionStatus(req.actionId, `Tạo khu vực thất bại`, 'fail')
    return res.sendStatus(403);
  }
}

async function updateArea(req, res) {
  if (req.actions.includes("updateArea")) {
    try {
      if(req.files?.file){
        const file = req.files.file
        file.mv( path.join(__dirname, `../../public/UploadFiles/${file.name}`), (err) => {
          console.log(err)
        })
      }
      let newArea = { updatedTime: Date.now(), file: req.files?.file, ...req.body };
      let updatedArea = await Areas.findOneAndUpdate(
        { _id: req.params.id },
        newArea
      );
      if (!updatedArea) {
        let response = new ResponseModel(0, "No item found!", null);
        await setActionStatus(req.actionId, `Cập nhật khu vực ${updatedArea.code} thất bại`, 'fail')
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Update area success!", newArea);
        await setActionStatus(req.actionId, `Cập nhật khu vực ${updatedArea.code} thành công`, 'success')
        res.json(response);
      }
    } catch (error) {
      console.log(error)
      let response = new ResponseModel(404, error.message, error);
      await setActionStatus(req.actionId, `Cập nhật khu vực`, 'fail')
      res.status(404).json(response);
    }
  } else {
    await setActionStatus(req.actionId, `Cập nhật khu vực ${req.body.code} thất bại`, 'fail')
    res.sendStatus(403);
  }
}

async function deleteArea(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.actions.includes("deleteArea")) {
    if (req.params.id) {
      try {
        const thisArea = await Areas.findById(req.params.id)
        let area = await Areas.findByIdAndDelete(req.params.id);
        if (!area) {
          let response = new ResponseModel(0, "No item found!", null);
          await setActionStatus(req.actionId, `Xoá khu vực ${thisArea.code} thất bại`, 'fail')
          res.json(response);
        } else {
          let response = new ResponseModel(1, "Delete area success!", null);
          await setActionStatus(req.actionId, `Xoá khu vực ${thisArea.code} thành công`, 'success')
          res.json(response);
        }
      } catch (error) {
        let response = new ResponseModel(404, error.message, error);
        res.status(404).json(response);
      }
    } else {
      await setActionStatus(req.actionId, `Xoá khu vực ${thisArea.code} thất bại`, 'fail')
      res
        .status(404)
        .json(new ResponseModel(404, "AreaId is not valid!", null));
    }
  } else {
    res.sendStatus(403);
  }
}

async function getAreaById(req, res) {
  if (req.body.areaId) {
    try {
      let area = await Areas.findById(req.body.areaId);
      res.json(area);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "areaId is not valid!", null));
  }
}

async function getPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = { areaName: { $regex: ".*" + req.query.search + ".*" } };
  }
  try {
    let area = await Areas.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });
    let count = await Areas.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex, 
      pageSize, 
      totalPages, 
      area, 
      count
      );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getAllLocations(req, res){
  try {
    const location = await Areas.find()
    return res.status(200).json({location: location})
  } catch (error) {
    console.log(error)
    return res.status(500).json({message: error})
  }
}

exports.getAllLocations = getAllLocations;
exports.insertArea = insertArea;
exports.updateArea = updateArea;
exports.deleteArea = deleteArea;
exports.getAreaById = getAreaById;
exports.getPaging = getPaging;
