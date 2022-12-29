const express = require("express");
const router = express.Router();
const vmConfigController = require("../controllers/vmConfigController");
// const middlewares = require('./middlewares');
// router.get('/', middlewares.authorize, statisticController.getAllUserStatistic)

router.get("/getPaging", vmConfigController.getPagingVmConfig);
router.get("/getById/:id", vmConfigController.getByVmConfigById);
router.post("/insert", vmConfigController.insertVmConfig);
router.put("/update/:id", vmConfigController.updateVmConfig);
router.delete("/delete/:id", vmConfigController.deleteVmConfig);

module.exports = router;
