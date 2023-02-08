const express = require('express');
const router = express.Router();
const operatingSystemController = require('../controllers/operatingSystemController');
const {createAction} = require('./actionMiddleWare');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, createAction('Thêm hệ điều hành'),operatingSystemController.insertOperatingSystem);
router.put('/update/:id', middlewares.authorize, createAction('Update hệ điều hành'),operatingSystemController.updateOperatingSystem);
router.delete('/delete/:id', middlewares.authorize, createAction('Xoá hệ điều hành'),operatingSystemController.deleteOperatingSystem);
router.post('/getById', middlewares.authentication, operatingSystemController.getOperatingSystemById);
router.get('/getPaging', middlewares.authentication, operatingSystemController.getPaging);
router.get('/getOperatingSystem', middlewares.authentication, operatingSystemController.getOperatingSystem);
router.get('/getOperatingSystemChildren', middlewares.authentication, operatingSystemController.getOperatingSystemChildren);
router.get('/initOperatingSystem', operatingSystemController.initOperatingSystem)

module.exports = router;