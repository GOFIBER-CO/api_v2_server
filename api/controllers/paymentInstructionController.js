const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const PayementInstructions = require("../../database/entities/PaymentInstructions");
const generateRandomString = require("../../helpers/generateRandomString");

async function insertPayment(req, res) {
  if (req.actions.includes("insertPayment")) {
    try {
      req.body.code = generateRandomString()
      let payment = new PayementInstructions(req.body);
      payment.createdTime = Date.now();

      payment.save(function (err, newPayment) {
        if (err) {
          let response = new ResponseModel(-1, err.message, err);
          res.json(response);
        } else {
          let response = new ResponseModel(
            1,
            "Create payment success!",
            newNoti
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

async function updatePayment(req, res) {
  if (req.actions.includes("updatePayment")) {
    try {
      let newPayment = { updatedTime: Date.now(), ...req.body };
      let updatedPayment = await PayementInstructions.findOneAndUpdate(
        { _id: req.params.id },
        newPayment
      );
      if (!updatedPayment) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Update Notification success!", newPayment);
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

async function deletePayment(req, res) {
  if (req.actions.includes("deletePayment")) {
  // if (isValidObjectId(req.params.id)) {
    if (req.params.id) {
      try {
        let payment = await PayementInstructions.findByIdAndDelete(req.params.id);
        if (!payment) {
          let response = new ResponseModel(0, "No item found!", null);
          res.json(response);
        } else {
          let response = new ResponseModel(1, "Delete payment success!", null);
          res.json(response);
        }
      } catch (error) {
        let response = new ResponseModel(404, error.message, error);
        res.status(404).json(response);
      }
    } else {
      res
        .status(404)
        .json(new ResponseModel(404, "PaymentId is not valid!", null));
    }
  } else {
    res.sendStatus(403);
  }
}

async function getPaymentById(req, res) {
  if (req.body.paymentId) {
    try {
      let payment = await PayementInstructions.findById(req.body.paymentId);
      res.json(payment);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "PaymentId is not valid!", null));
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
    let payment = await PayementInstructions.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });

    let count = await PayementInstructions.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, payment,count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

exports.insertPayment = insertPayment;
exports.updatePayment = updatePayment;
exports.deletePayment = deletePayment;
exports.getPaymentById = getPaymentById;
exports.getPaging = getPaging;
