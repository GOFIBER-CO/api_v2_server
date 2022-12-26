const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const Logs = require("../../database/entities/Logs");
const generateRandomString = require("../../helpers/generateRandomString");

async function insertLog(req, res) {
  try {
    req.body.code = generateRandomString()
    let log = new Logs(req.body);
    log.createdTime = Date.now();

    log.save(function (err, newLog) {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        res.json(response);
      } else {
        let response = new ResponseModel(
          1,
          "Create log success!",
          newLog
        );
        res.json(response);
      }
    });
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function updateLog(req, res) {
  try {
    let newLog = { updatedTime: Date.now(), ...req.body };
    let updatedLog = await Logs.findOneAndUpdate(
      { _id: req.params.id },
      newLog
    );
    if (!updatedLog) {
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      let response = new ResponseModel(1, "Update log success!", newLog);
      res.json(response);
    }
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function deleteLog(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.params.id) {
    try {
      let log = await Logs.findByIdAndDelete(req.params.id);
      if (!log) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Delete log success!", null);
        res.json(response);
      }
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "logId is not valid!", null));
  }
}

async function getLogById(req, res) {
  if (req.body.logId) {
    try {
      let log = await Logs.findById(req.body.logId);
      res.json(log);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "logId is not valid!", null));
  }
}

async function getPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = { logName: { $regex: ".*" + req.query.search + ".*" } };
  }

  try {
    let log = await Logs.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

    let count = await Logs.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, log, count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getLogByUserId(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = { logName: { $regex: ".*" + req.query.search + ".*" } };
  }
  if(req.query.userId){
    searchObj.user = req.query.userId
  }
  if(req.query.cloudServerId){
    searchObj.cloudServer = req.query.cloudServerId
  }

  try {
    let log = await Logs.find(searchObj)
    .skip(pageSize * pageIndex - pageSize)
    .limit(parseInt(pageSize))
    .sort({
      createdTime: "desc",
    })
    .populate("user")
    .populate("cloudServer")

    let count = await Logs.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, log,count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

exports.insertLog = insertLog;
exports.updateLog = updateLog;
exports.deleteLog = deleteLog;
exports.getLogById = getLogById;
exports.getPaging = getPaging;
exports.getLogByUserId = getLogByUserId;

