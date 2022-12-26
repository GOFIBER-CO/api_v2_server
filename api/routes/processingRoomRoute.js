const express = require('express');
const router = express.Router();
const processingRoomController = require('../controllers/processingRoomController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, processingRoomController.insertProcessingRoom);
router.put('/update/:id', middlewares.authorize, processingRoomController.updateProcessingRoom);
router.delete('/delete/:id', middlewares.authorize, processingRoomController.deleteProcessingRoom);
router.post('/getById', middlewares.authorize, processingRoomController.getProcessingRoomById);
router.get('/getPaging', middlewares.authentication, processingRoomController.getPaging);

module.exports = router;