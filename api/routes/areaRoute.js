const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const {createAction} = require('./actionMiddleWare');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, createAction('Tạo mới khu vực') ,areaController.insertArea);
router.put('/update/:id', middlewares.authorize, createAction('Thay đổi thông tin khu vực'), areaController.updateArea);
router.delete('/delete/:id', middlewares.authorize,createAction('Xoá khu vực'), areaController.deleteArea);
router.post('/getById', middlewares.authentication, areaController.getAreaById);
router.get('/getPaging', middlewares.authentication, areaController.getPaging);
router.get('/getAllLocations', middlewares.authentication, areaController.getAllLocations)

module.exports = router;