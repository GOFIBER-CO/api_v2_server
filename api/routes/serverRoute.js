const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const {createAction} = require('./actionMiddleWare');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication,createAction('Thêm server mới'),serverController.insertServer);
router.put('/update/:id', middlewares.authentication,createAction("Cập nhật thông tin server"),serverController.updateServer);
router.delete('/delete/:id', middlewares.authorize,createAction("Xoá server"),serverController.deleteServer);
router.post('/getById', middlewares.authentication,serverController.getServerById);
router.get('/getPaging', middlewares.authentication,serverController.getPaging);

module.exports = router;