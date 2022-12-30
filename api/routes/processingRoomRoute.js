const express = require('express');
const router = express.Router();
const processingRoomController = require('../controllers/processingRoomController');
const createAction = require('./actionMiddleWare');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, createAction('Tạo phòng ban mới'),processingRoomController.insertProcessingRoom);
router.put('/update/:id', middlewares.authorize, createAction('Update phòng ban'),processingRoomController.updateProcessingRoom);
router.delete('/delete/:id', middlewares.authorize, createAction('Xoá phòng ban'),processingRoomController.deleteProcessingRoom);
router.post('/getById', middlewares.authorize, processingRoomController.getProcessingRoomById);
router.get('/getPaging', middlewares.authentication, processingRoomController.getPaging);

module.exports = router;