const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const {createAction} = require('./actionMiddleWare');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication, createAction("Thêm ticket mới"),supportController.insertSupport);
router.put('/update/:id', middlewares.authorize, createAction("Cập nhật ticket"),supportController.updateSupport);
router.delete('/delete/:id', middlewares.authorize, createAction("Xoá ticket"),supportController.deleteSupport);
router.post('/getById', middlewares.authorize, supportController.getSupportById);
router.get('/getSupportByUserId', middlewares.authentication, supportController.getSupportByUserId);
router.get('/getPaging', middlewares.authorize, supportController.getPaging);


module.exports = router;