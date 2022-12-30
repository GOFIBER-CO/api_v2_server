const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const ProcessingRooms = require("../../database/entities/ProcessingRooms");
const generateRandomString = require("../../helpers/generateRandomString");
const { setActionStatus } = require("../routes/actionMiddleWare");

async function insertProcessingRoom(req, res) {
if (req.actions.includes("insertProcessingRoom")) {
  try {
    req.body.code = generateRandomString()
    let processingRoom = new ProcessingRooms(req.body);
    processingRoom.createdTime = Date.now();

    await processingRoom.save(async function (err, newProcessingRoom) {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        await setActionStatus(req.actionId, `Tạo phòng ban`, 'fail')
        res.json(response);
      } else {
        await setActionStatus(req.actionId, `Tạo phòng ban ${newProcessingRoom.code}`, 'success')
        let response = new ResponseModel(
          1,
          "Create processing room success!",
          newProcessingRoom
        );
        res.json(response);
      }
    });
  } catch (error) {
    await setActionStatus(req.actionId, `Tạo phòng ban`, 'fail')
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}
}

async function updateProcessingRoom(req, res) {
  // if (req.actions.includes("updateProcessingRoom")) {
    try {
      let newProcessingRoom = { updatedTime: Date.now(), ...req.body };
      let updatedProcessingRoom = await ProcessingRooms.findOneAndUpdate(
        { _id: req.params.id },
        newProcessingRoom
      );
      if (!updatedProcessingRoom) {
        await setActionStatus(req.actionId, `Cập nhật phòng ban`, 'fail')
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        await setActionStatus(req.actionId, `Cập nhật phòng ban ${updatedProcessingRoom.code}`, 'success')
        let response = new ResponseModel(1, "Update processing room success!", newProcessingRoom);
        res.json(response);
      }
    } catch (error) {
      await setActionStatus(req.actionId, `Cập nhật phòng ban`, 'success')
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  // } else {
  //   await setActionStatus(req.actionId, `Cập nhật phòng ban ${req.body.code}`, 'success')
  //   res.sendStatus(403);
  // }
}

async function deleteProcessingRoom(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.actions.includes("deleteProcessingRoom")) {
    if (req.params.id) {
      try {
        const thisProcessingRoom = await ProcessingRooms.findById(req.params.id)
        let processingRoom = await ProcessingRooms.findByIdAndDelete(req.params.id);
        if (!processingRoom) {
          await setActionStatus(req.actionId, `Xoá phòng ban ${thisProcessingRoom.code}`, 'fail')
          let response = new ResponseModel(0, "No item found!", null);
          res.json(response);
        } else {
          await setActionStatus(req.actionId, `Xoá phòng ban ${thisProcessingRoom.code}`, 'success')
          let response = new ResponseModel(1, "Delete processing room success!", null);
          res.json(response);
        }
      } catch (error) {
        await setActionStatus(req.actionId, `Xoá phòng ban`, 'fail')
        let response = new ResponseModel(404, error.message, error);
        res.status(404).json(response);
      }
    } else {
      await setActionStatus(req.actionId, `Xoá phòng ban`, 'fail')
      res
        .status(404)
        .json(new ResponseModel(404, "AreaId is not valid!", null));
    }
  } else {
    await setActionStatus(req.actionId, `Xoá phòng ban`, 'fail')
    res.sendStatus(403);
  }
}

async function getProcessingRoomById(req, res) {
  if (req.body.processingRoomId) {
    try {
      let processingRoom = await ProcessingRooms.findById(req.body.processingRoomId);
      res.json(processingRoom);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "processingRoomId is not valid!", null));
  }
}

async function getPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = { processingRoomName: { $regex: ".*" + req.query.search + ".*" } };
  }
  try {
    let processingRoom = await ProcessingRooms.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

    let count = await ProcessingRooms.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, processingRoom,count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

exports.insertProcessingRoom = insertProcessingRoom;
exports.updateProcessingRoom = updateProcessingRoom;
exports.deleteProcessingRoom = deleteProcessingRoom;
exports.getProcessingRoomById = getProcessingRoomById;
exports.getPaging = getPaging;
