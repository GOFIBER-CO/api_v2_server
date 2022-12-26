const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, notificationController.insertNotification);
router.put('/update/:id', middlewares.authorize, notificationController.updateNotification);
router.delete('/delete/:id', middlewares.authorize, notificationController.deleteNotification);
router.post('/getById', middlewares.authorize, notificationController.getNotificationById);
router.get('/getPaging', middlewares.authorize, notificationController.getPaging);
router.get('/getByUserId', middlewares.authentication, notificationController.getNotificationByUserId)
router.get('/getBySlug', middlewares.authentication, notificationController.getNotificationBySlug)

module.exports = router;