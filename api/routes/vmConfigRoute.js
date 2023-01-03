const express = require("express");
const router = express.Router();
const vmConfigController = require("../controllers/vmConfigController");
const middlewares = require("./middlewares");
// router.get('/', middlewares.authorize, statisticController.getAllUserStatistic)

router.get(
  "/getPaging",
  middlewares.authorize,
  vmConfigController.getPagingVmConfig
);
router.get(
  "/getById/:id",
  middlewares.authorize,
  vmConfigController.getByVmConfigById
);
router.post("/insert", vmConfigController.insertVmConfig);
router.put(
  "/update/:id",
  middlewares.authorize,
  vmConfigController.updateVmConfig
);
router.delete(
  "/delete/:id",
  middlewares.authorize,
  vmConfigController.deleteVmConfig
);

module.exports = router;
