const { isValidObjectId } = require("mongoose");
const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const Snapshots = require("../../database/entities/Snapshots");
const generateRandomString = require("../../helpers/generateRandomString");
const Logs = require("../../database/entities/Logs");

async function createSnapshot(req, res) {
  try {
    req.body.code = generateRandomString()
    let snapshot = new Snapshots(req.body);
    snapshot.createdTime = Date.now();

    snapshot.save(async function (err, newSnapshot) {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        res.json(response);
      } else {
        //lưu log tạo Snapshot
        let newLog = new Logs({
          code: generateRandomString(),
          logName: "Tạo snapshot",
          content: `Khởi tạo snapshot ${req.body.content}`,
          user: newSnapshot.user,
          cloudServer: newSnapshot.cloudServer,
          status: 1,
          completionTime:  Date.now(),
        });
        await newLog.save(async function (err, newLog) {
          if (err) {
            let response = new ResponseModel(-1, err.message, err);
            res.json(response);
          }
        })

        let response = new ResponseModel(1, "Create snapshot success!", newSnapshot);
        res.json(response);
      }
    });
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function updateSnapshot(req, res) {
  try {
    let newSnapshot = { updatedTime: Date.now(), ...req.body };
    let updatedSnapshot = await Snapshots.findOneAndUpdate(
      { _id: req.params.id },
      newSnapshot
    );
    if (!updatedSnapshot) {
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      //lưu log udpate Snapshot
      let newLog = new Logs({
        code: generateRandomString(),
        logName: "cập nhật snapshot",
        content: `cập nhật tạo snapshot ${req.body.content}`,
        user: newSnapshot.user,
        cloudServer: updatedSnapshot.cloudServer,
        status: 1,
        completionTime:  Date.now(),
      });
      await newLog.save(async function (err, newLog) {
        if (err) {
          let response = new ResponseModel(-1, err.message, err);
          res.json(response);
        }
      })

      let response = new ResponseModel(1, "Update snapshot success!", newSnapshot);
      res.json(response);
    }
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function deleteSnapshot(req, res) {
  if (req.params.id) {
    try {
      let snapshot = await Snapshots.findByIdAndDelete(req.params.id);
      if (!snapshot) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        //lưu log xóa Snapshot
        let newLog = new Logs({
          code: generateRandomString(),
          logName: "Xóa snapshot",
          content: `Xóa tạo snapshot ${req.body.content}`,
          user: snapshot.user,
          cloudServer: snapshot.cloudServer,
          status: 1,
          completionTime:  Date.now(),
        });
        await newLog.save(async function (err, newLog) {
          if (err) {
            let response = new ResponseModel(-1, err.message, err);
            res.json(response);
          }
        })
        let response = new ResponseModel(1, "Delete snapshot success!", null);
        res.json(response);
      }
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    res.status(404).json(new ResponseModel(404, "SnapshotId is not valid!", null));
  }
}

async function getPagingSnapshot(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = { code: { $regex: ".*" + req.query.search + ".*" } };
  }
  try {
    let snapshot = await Snapshots.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });
    let count = await Snapshots.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, snapshot, count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getSnapshotById(req, res) {
  if (isValidObjectId(req.params.id)) {
    try {
      let snapshot = await Snapshots.findById(req.params.id);
      res.json(snapshot);
    } catch (error) {
      res.status(404).json(404, error.message, error);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "SnapshotId is not valid!", null));
  }
}

async function getSnapshotByUserId(req, res) {
    let pageSize = req.query.pageSize || 10;
    let pageIndex = req.query.pageIndex || 1;

    let searchObj = {};
    if (req.query.search) {
        searchObj = { code: { $regex: ".*" + req.query.search + ".*" } };
    }
    if (req.query.userId) {
        searchObj.user = req.query.userId;
    }
    if (req.query.cloudServerId) {
        searchObj.cloudServers = req.query.cloudServerId;
    }
    try {
        let snapshot = await Snapshots.find(searchObj)
        .skip(pageSize * pageIndex - pageSize)
        .limit(parseInt(pageSize))
        .sort({
            createdTime: "desc",
        });
        let count = await Snapshots.find(searchObj).countDocuments();
        let totalPages = Math.ceil(count / pageSize);
        let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, snapshot, count);
        res.json(pagedModel);
    } catch (error) {
        let response = new ResponseModel(404, error.message, error);
        res.status(404).json(response);
    }
}

exports.createSnapshot = createSnapshot;
exports.updateSnapshot = updateSnapshot;
exports.deleteSnapshot = deleteSnapshot;
exports.getPagingSnapshot = getPagingSnapshot;
exports.getSnapshotById = getSnapshotById;
exports.getSnapshotByUserId = getSnapshotByUserId;

