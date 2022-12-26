const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const Notification = require("../../database/entities/Notification");
const randomString = require('../../helpers/generateRandomString');
const socketService = require("./socketService");

async function createNotification(reciever, name, type, content, status = true){
  const code = randomString(10)
  const slug = code

  try {
    const notification = await Notification.create({
      code: code,
      slug: slug,
      reciever: [reciever],
      name: name,
      type: type,
      content: content,
      status: status
    })
  } catch (error) {
    console.log(error)
  }
}

async function insertNotification(req, res) {
  // if (req.actions.includes("insertNotification")) {
    try {
      const code = randomString(10)
      req.body.code = code
      req.body.slug = code
      let noti = new Notification(req.body);
      noti.createdTime = Date.now();

      noti.save(function (err, newNoti) {
        if (err) {
          let response = new ResponseModel(-1, err.message, err);
          res.json(response);
        } else {
          let response = new ResponseModel(
            1,
            "Tạo thông báo thành công",
            newNoti
          );
          if(req.body.status){
            const onlineUser = socketService.getOnlineUser()
            onlineUser.map((item)=>{
              if(req.body.reciever?.includes(item.userId)){
                _io.to(item.id).emit('send notification', newNoti)
              }
            })
          }
          res.json(response);
        }
      });
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  // } else {
  //   res.sendStatus(403);
  // }
}

async function updateNotification(req, res) {
  if (req.actions.includes("updateNoti")) {
    try {
      let newNoti = { updatedTime: Date.now(), ...req.body };
      let updatedNoti = await Notification.findOneAndUpdate(
        { _id: req.params.id },
        newNoti
      );
      if (!updatedNoti) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Update Notification success!", newNoti);
        res.json(response);
      }
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    res.sendStatus(403);
  }
}

async function deleteNotification(req, res) {
  if (req.actions.includes("updateNoti")) {
  // if (isValidObjectId(req.params.id)) {
    if (req.params.id) {
      try {
        let noti = await Notification.findByIdAndDelete(req.params.id);
        if (!noti) {
          let response = new ResponseModel(0, "No item found!", null);
          res.json(response);
        } else {
          let response = new ResponseModel(1, "Delete notification success!", null);
          res.json(response);
        }
      } catch (error) {
        let response = new ResponseModel(404, error.message, error);
        res.status(404).json(response);
      }
    } else {
      res
        .status(404)
        .json(new ResponseModel(404, "NotificationId is not valid!", null));
    }
  } else {
    res.sendStatus(403);
  }
}

async function getNotificationById(req, res) {
  if (req.body.notiId) {
    try {
      let notification = await Notification.findById(req.body.notiId);
      res.json(notification);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "NotificationId is not valid!", null));
  }
}

async function getPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = { name: { $regex: ".*" + req.query.search + ".*" } };
  }
  try {
    let noti = await Notification.find(searchObj).populate("sender")
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

    let count = await Notification.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, noti, count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getNotificationByUserId(req, res){
  if(req.query.userId){
    const userId = req.query.userId
    let searchObj = {}
    if(req.query.type){
      searchObj.type = req.query.type
    }
    searchObj.reciever = userId
    try {
      const result = await Notification.find(searchObj)
      return res.status(200).json({notifications: result})
    } catch (error) {
      console.log(error)
      return res.status(500).json({message: error})
    }
  }else{
    return res.status(403).json({message: 'Không tìm thấy người dùng'})
  }

}

async function getNotificationBySlug(req, res){
  try {
    if(!req.query.slug || !req.query.userId){
      return res.status(404).json({message: "Không tìm thấy thông báo"})
    }
    const slug = req.query.slug
    const userId = req.query.userId
    const result = await Notification.findOne({slug: slug, reciever: userId}).populate('sender')
    return res.status(200).json({notification: result})
  } catch (error) {
    console.log(error)
    return res.status(500).json({message: "Có lỗi trong quá trình tải dữ liệu"})
  }
}

exports.getNotificationBySlug = getNotificationBySlug
exports.insertNotification = insertNotification;
exports.updateNotification = updateNotification;
exports.deleteNotification = deleteNotification;
exports.getNotificationById = getNotificationById;
exports.getPaging = getPaging;
exports.getNotificationByUserId = getNotificationByUserId
exports.createNotification = createNotification
