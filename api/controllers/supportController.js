const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const Supports = require("../../database/entities/Supports");
const { default: mongoose } = require("mongoose");
const path = require('path')
const generateRandomString = require("../../helpers/generateRandomString");
const socketService = require("./socketService");
const Notification = require("../../database/entities/Notification");
const Users = require("../../database/entities/authentication/Users");
const { setActionStatus } = require("../routes/actionMiddleWare");

async function insertSupport(req, res) {
    try {
      if(req.files?.file){
        const file = req.files.file
        file.mv( path.join(__dirname, `../../public/UploadFiles/${file.name}`), (err) => {
          console.log(err)
        })
      }
      const code = generateRandomString()
      const result = await Supports.create({
        level: Number(req.body.level),
        title: req.body.title,
        content: req.body.content,
        user: mongoose.Types.ObjectId(req.body.user),
        processingRoom: mongoose.Types.ObjectId(req.body.processingRoom),
        file: req.files?.file?.name,
        code: code,
        slug: code,
      })
      const onlineUser = socketService.getOnlineUser()
      await Promise.all(onlineUser.map(async (item) => {
        const user = await Users.findById(item.userId)
        if(!user.isCustomer){
          _io.to(item.id).emit('new ticket is sent', result)
        }
        return 'Done'
      }))
      await setActionStatus(req.actionId, `Tạo ticket ${result.code} thành công`, 'success')
      return res.status(200).json({message: 'Tạo ticket thành công'})
    } catch (error) {
      await setActionStatus(req.actionId, `Tạo ticket`, 'fail')
      return res.status(500).json({message: error})
    }
}

async function updateSupport(req, res) {
  try {
    let newSupport = { updatedTime: Date.now(), status: req.body.status, modifiedBy:req.body.modifiedUser};
    let updatedSupport = await Supports.findOneAndUpdate(
      { _id: req.params.id },
      newSupport
    );
    if (!updatedSupport) {
      await setActionStatus(req.actionId, `Cập nhật ticket`, 'fail') 
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      await setActionStatus(req.actionId, `Cập nhật ticket ${updatedSupport.code}`, 'success') 
      let response = new ResponseModel(1, "Update support success!", newSupport);
      notiCode = randomString(10)
      let noti = new Notification({
        code: notiCode,
        name: req.body.status == 1 ? 'Ticket của bạn đã được xác nhận, vui lòng chờ xử lí' : (req.body.status == 2 ? 'Ticket của bạn đã được xử lí' : ''),
        content: req.body.feedBack,
        status: true,
        reciever: [req.body.userId],
        sender: req.body.modifiedUser,
        type: 'ticket',
        slug: notiCode,
      });
      noti.createdTime = Date.now();
      await noti.save()
      const onlineUser = socketService.getOnlineUser()
      onlineUser.map((item)=>{
        if(item.userId == req.body.userId){
          _io.to(item.id).emit('send notification', noti)
        }
      })
      res.json(response);
    }
  } catch (error) {
    await setActionStatus(req.actionId, `Cập nhật ticket`, 'fail') 
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function deleteSupport(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.params.id) {
    try {
      const thisSupport = await Supports.findById(req.params.id)
      let support = await Supports.findByIdAndDelete(req.params.id);
      if (!support) {
        await setActionStatus(req.actionId, `Xoá ticket ${thisSupport.code}`, 'fail') 
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        await setActionStatus(req.actionId, `Xoá ticket ${thisSupport.code}`, 'success') 
        let response = new ResponseModel(1, "Delete support success!", null);
        res.json(response);
      }
    } catch (error) {
      await setActionStatus(req.actionId, `Xoá ticket`, 'fail') 
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    await setActionStatus(req.actionId, `Xoá ticket`, 'fail') 
    res
      .status(404)
      .json(new ResponseModel(404, "SupportId is not valid!", null));
  }
}

async function getSupportById(req, res) {
  const pageIndex = req.body.pageIndex || 1
  const pageSize = req.body.pageSize || 10
  if (req.body.supportId) {
    try {
      let support = await Supports.findById(req.body.supportId).populate('user').populate('processingRoom');
      res.json(support);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "supportId is not valid!", null));
  }
}

async function getPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;
 
  let searchObj = {};
  if(req.query.level != '0'){
    searchObj.level = req.query.level;
  }
  if (req.query.search) {
    searchObj.supportName = { $regex: ".*" + req.query.search + ".*" };
  }
  try {
    let support = await Supports.find(searchObj).populate('processingRoom').populate('user').populate('modifiedBy').find()
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

      const returnResult = support.filter(item => {
        if(!req.query.search){
          return item
        }else{
          return item.user?.email?.includes(req.query.search)
        }
      })

    let count = req.query.search ? returnResult.length : await Supports.find(searchObj).countDocuments() 
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex, 
      pageSize, 
      totalPages, 
      returnResult, 
      count
      );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getSupportByUserId(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  
  if (req.query.supportName) {
    searchObj = { supportName: { $regex: ".*" + req.query.supportName + ".*" } };
  }
  if(req.query.supportTT){
    searchObj.status = req.query.supportTT;
  }
  if(req.query.supportUT && req.query.supportUT != 0){
    searchObj.level = req.query.supportUT;
  }
  if(req.query.userId){
    searchObj.user = req.query.userId
  }

  try {
    let support = await Supports.find(searchObj).populate('processingRoom').populate('user').populate('modifiedBy')
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

    let count = await Supports.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex, 
      pageSize, 
      totalPages, 
      support, 
      count
      );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

exports.insertSupport = insertSupport;
exports.updateSupport = updateSupport;
exports.deleteSupport = deleteSupport;
exports.getSupportById = getSupportById;
exports.getSupportByUserId = getSupportByUserId;
exports.getPaging = getPaging;
