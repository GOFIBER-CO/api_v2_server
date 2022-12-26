const { isValidObjectId } = require("mongoose");
const PagedModel = require("../../models/PagedModel");
const ResponseModel = require("../../models/ResponseModel");
const Roles = require("../../../database/entities/authentication/Roles");
const generateRandomString = require("../../../helpers/generateRandomString");

async function createRole(req, res) {
  try {
    req.body.code = generateRandomString
    let role = new Roles(req.body);
    role.createdTime = Date.now();

    role.save(function (err, newRole) {
      if (err) {
        let response = new ResponseModel(-1, err.message, err);
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Create role success!", newRole);
        res.json(response);
      }
    });
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function updateRole(req, res) {
  try {
    let newRole = { updatedTime: Date.now(), ...req.body };
    let updatedRole = await Roles.findOneAndUpdate(
      { _id: req.params.id },
      newRole
    );
    if (!updatedRole) {
      let response = new ResponseModel(0, "No item found!", null);
      res.json(response);
    } else {
      let response = new ResponseModel(1, "Update role success!", newRole);
      res.json(response);
    }
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function deleteRole(req, res) {
  // if (isValidObjectId(req.params.id)) {
  if (req.params.id) {
    try {
      let role = await Roles.findByIdAndDelete(req.params.id);
      if (!role) {
        let response = new ResponseModel(0, "No item found!", null);
        res.json(response);
      } else {
        let response = new ResponseModel(1, "Delete role success!", null);
        res.json(response);
      }
    } catch (error) {
      let response = new ResponseModel(404, error.message, error);
      res.status(404).json(response);
    }
  } else {
    res.status(404).json(new ResponseModel(404, "RoleId is not valid!", null));
  }
}

async function getPagingRoles(req, res) {
  let pageSize = req.query.pageSize || 10;
  let pageIndex = req.query.pageIndex || 1;

  let searchObj = {};
  if (req.query.search) {
    searchObj = { roleName: { $regex: ".*" + req.query.search + ".*" } };
  }
  try {
    let roles = await Roles.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdTime: "desc",
      });
    let count = await Roles.find(searchObj).countDocuments();
    let totalPages = Math.ceil(count / pageSize);
    let pagedModel = new PagedModel(pageIndex, pageSize, totalPages, roles, count);
    res.json(pagedModel);
  } catch (error) {
    let response = new ResponseModel(404, error.message, error);
    res.status(404).json(response);
  }
}

async function getRoleById(req, res) {
  if (isValidObjectId(req.params.id)) {
    try {
      let role = await Roles.findById(req.params.id);
      res.json(role);
    } catch (error) {
      res.status(404).json(404, error.message, error);
    }
  } else {
    res
      .status(404)
      .json(new ResponseModel(404, "RoleId is not valid!", null));
  }
}

exports.createRole = createRole;
exports.updateRole = updateRole;
exports.deleteRole = deleteRole;
exports.getPagingRoles = getPagingRoles;
exports.getRoleById = getRoleById;
