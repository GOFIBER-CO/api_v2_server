const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const TransactionHistorys = require("../../database/entities/TransactionHistorys");
const Users = require("../../database/entities/authentication/Users");
const generateRandomString = require("../../helpers/generateRandomString");
const moment = require("moment");

async function insertTransactionHistory(req, res) {
  try {
    req.body.code = generateRandomString()
    let dataNow = moment(Date().toString()).format('DD/MM/YYYY hh:mm:ss');
    let transactionHistory = new TransactionHistorys(req.body);
    transactionHistory.createdTime = Date.now(); 
    transactionHistory.content = `User   nạp ${transactionHistory.price} vào tài khoản vào lúc ${dataNow}`

    transactionHistory.save(function (err, newTransactionHistory) {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        res.json(response);
      } else {
        let response = new ResponseModel(
          1,
          "Create transaction history success!",
          newTransactionHistory
        );
        res.json(response);
      }
    });
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function updateTransactionHistory(req, res) {
  if (req.actions.includes("updateTransactionHistory")) {
    try {
      let newTransactionHistory = { updatedTime: Date.now(), ...req.body };
      let updatedTransactionHistory = await TransactionHistorys.findOneAndUpdate(
        { _id: req.params.id },
        newTransactionHistory
      );
      if (!updatedTransactionHistory) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Update transaction history success!", newTransactionHistory);
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

async function deleteTransactionHistory(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.actions.includes("deleteTransactionHistory")) {
    if (req.params.id) {
      try {
        let transactionHistory = await TransactionHistorys.findByIdAndDelete(req.params.id);
        if (!transactionHistory) {
          let response = new ResponseModel(0, "No item found!", null);
          res.json(response);
        } else {
          let response = new ResponseModel(1, "Delete transaction history success!", null);
          res.json(response);
        }
      } catch (error) {
        let response = new ResponseModel(404, error.message, error);
        res.status(404).json(response);
      }
    } else {
      res
        .status(404)
        .json(new ResponseModel(404, "transactionHistoryId is not valid!", null));
    }
  } else {
    res.sendStatus(403);
  }
}

async function getTransactionHistoryById(req, res) {
  if (req.body.transactionHistoryId) {
    try {
      let transactionHistory = await TransactionHistorys.findById(req.body.transactionHistoryId);
      res.json(transactionHistory);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "transactionHistoryId is not valid!", null));
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
    let transactionHistory = await TransactionHistorys.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

    let count = await TransactionHistorys.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, transactionHistory, count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getByUserId(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj.areaName = { $regex: ".*" + req.query.search + ".*" };
  }
  if(req.query.userId){
    searchObj.user = req.query.userId
  }

  try {
    let transactionHistory = await TransactionHistorys.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

    let count = await TransactionHistorys.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, transactionHistory, count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function confirmRefills(req, res) {
  if (req.actions.includes("confirmRefills")) {
    try {
      //tính tổng  giá tiền 
      let transactionHistory = await TransactionHistorys.findById(req.params.id);
      
      let user = await Users.findOne({ _id: transactionHistory.user});
      //cộng tiền nạp vào tài khoản và số dư của tài khoản
      let totalPrice = user.surplus + transactionHistory.price;
      if(req.body.status == 2){
        //số dư trước luôn luôn bằng với số dự của tài khoản
        transactionHistory.balanceBeforeTransaction = user.surplus;
        //số dư sau
        transactionHistory.balanceAfterTransaction = totalPrice;
        //tiền nạp đưa về bằng 0
        transactionHistory.price = 0;
      }
      //câp nhật số dư của user
      user.surplus = totalPrice;
      let newUser = { updatedTime: Date.now(), ...user };
      let updatedUser = await Users.findOneAndUpdate(
        { _id: transactionHistory.user },
        newUser
      );
      if (!updatedUser) {
        let response = new ResponseModel(0, "user No found!", null);
        res.json(response);
      } 
      
      //lưu lại lịch sử admin xác nhận nạp tiền
      let dataNow = moment(new Date()).format('DD/MM/YYYY hh:mm:ss')
      transactionHistory.content  =`admin xác nhận nạp tiền vào tài khảo ${dataNow}`

      let createTransactionHistory = new TransactionHistorys({
        code: generateRandomString(),
        transactionHistoryName: transactionHistory.content,
        content: transactionHistory.content,
        balanceBeforeTransaction: transactionHistory.balanceBeforeTransaction,
        price: transactionHistory.price,
        balanceAfterTransaction: transactionHistory.balanceAfterTransaction,
        status: 2,
        user: transactionHistory.user,
        createdTime:  Date.now()
      });
      createTransactionHistory.save(function (err, newTransactionHistory) {
        if (err) {
          let response = new ResponseModel(-1, err.message, err);
          res.json(response);
        } else {
          let response = new ResponseModel(
            1,
            "Create transaction history success!",
            newTransactionHistory
          );
          res.json(response);
        }
      });   
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    res.sendStatus(403);
  }
}

async function getTransactionHistoryByCloudId(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj.areaName = { $regex: ".*" + req.query.search + ".*" };
  }
  if(req.query.userId){
    searchObj.user = req.query.userId
  }
  if(req.query.cloudId){
    searchObj.cloudServer = req.query.cloudId
  }

  try {
    let transactionHistory = await TransactionHistorys.find(searchObj)
    .skip(pageSize * pageIndex - pageSize)
    .limit(parseInt(pageSize))
    .sort({
      createdTime: "desc",
    })
    .populate("user")
    .populate("cloudServer")

    let count = await TransactionHistorys.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, transactionHistory, count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

exports.insertTransactionHistory = insertTransactionHistory;
exports.updateTransactionHistory = updateTransactionHistory;
exports.deleteTransactionHistory = deleteTransactionHistory;
exports.getTransactionHistoryById = getTransactionHistoryById;
exports.getPaging = getPaging;
exports.getByUserId = getByUserId;
exports.confirmRefills = confirmRefills;
exports.getTransactionHistoryByCloudId = getTransactionHistoryByCloudId;