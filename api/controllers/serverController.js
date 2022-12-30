const PagedModel = require("../models/PagedModel");
const ResponseModel = require("../models/ResponseModel");
const Servers = require("../../database/entities/Servers");
const generateRandomString = require("../../helpers/generateRandomString");
const { setActionStatus } = require("../routes/actionMiddleWare");

async function insertServer(req, res) {
  console.log(req.body, `oooo`);
  // return;
  try {
    req.body.code = generateRandomString();
    let server = new Servers(req.body);
    server.createdTime = Date.now();

    await server.save(function (err, newServer) {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        res.json(response);
      } else {
        let response = new ResponseModel(
          1,
          "Create server success!",
          newServer
        );
        res.json(response);
      }
    });
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function updateServer(req, res) {
  // if (req.actions.includes("updateServer")) {
  try {
    let newServer = { updatedTime: Date.now(), ...req.body };
    let updatedServer = await Servers.findOneAndUpdate(
      { _id: req.params.id },
      newServer
    );
    if (!updatedServer) {
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      let response = new ResponseModel(1, "Update server success!", newServer);
      res.json(response);
    }
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
  // } else {
  //   res.sendStatus(403);
  // }
}

async function deleteServer(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.params.id) {
    try {
      let server = await Servers.findByIdAndDelete(req.params.id);
      if (!server) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Delete server success!", null);
        res.json(response);
      }
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "ServerId is not valid!", null));
  }
}

async function getServerById(req, res) {
  if (req.body.serverId) {
    try {
      let server = await Servers.findById(req.body.serverId);
      res.json(server);
    } catch (error) {
      let response = new ResponseModel(-2, error.message, error);
      res.json(response);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "ServerId is not valid!", null));
  }
}

async function getPaging(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj.serverName = { $regex: ".*" + req.query.search + ".*" };
  }
  if (req.query.serverDefault) {
    searchObj.serverDefault = req.query.serverDefault;
  }
  if (req.query.expiryDateType) {
    searchObj.expiryDateType = req.query.expiryDateType;
  }

  try {
    let servers = await Servers.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "asc",
      });

    let count = await Servers.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(
      pageIndex,
      pageSize,
      totalPages,
      servers,
      count
    );
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

exports.insertServer = insertServer;
exports.updateServer = updateServer;
exports.deleteServer = deleteServer;
exports.getServerById = getServerById;
exports.getPaging = getPaging;
