const express = require('express');
const router = express.Router();
const transactionHistoryController = require('../controllers/transactionHistoryController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication, transactionHistoryController.insertTransactionHistory);
router.put('/update/:id', middlewares.authorize, transactionHistoryController.updateTransactionHistory);
router.delete('/delete/:id', middlewares.authorize, transactionHistoryController.deleteTransactionHistory);
router.post('/getById', middlewares.authentication, transactionHistoryController.getTransactionHistoryById);
router.get('/getPaging', middlewares.authentication, transactionHistoryController.getPaging);
router.get('/getByUserId', middlewares.authentication, transactionHistoryController.getByUserId);
router.put('/confirmRefills/:id', middlewares.authorize, transactionHistoryController.confirmRefills);
router.get('/getTransactionHistoryByCloudId', middlewares.authentication, transactionHistoryController.getTransactionHistoryByCloudId);

module.exports = router;