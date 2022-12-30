const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const {createAction} = require('./actionMiddleWare');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, createAction('Tạo thông báo mới'),notificationController.insertNotification);
router.put('/update/:id', middlewares.authorize, createAction('Update thông báo'),notificationController.updateNotification);
router.delete('/delete/:id', middlewares.authorize, createAction('Xoá thông báo'),notificationController.deleteNotification);
router.post('/getById', middlewares.authorize, notificationController.getNotificationById);
router.get('/getPaging', middlewares.authorize, notificationController.getPaging);
router.get('/getByUserId', middlewares.authentication, notificationController.getNotificationByUserId)
router.get('/getBySlug', middlewares.authentication, notificationController.getNotificationBySlug)

module.exports = router;