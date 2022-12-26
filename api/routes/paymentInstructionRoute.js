const express = require('express');
const router = express.Router();
const paymentInstructionController = require('../controllers/paymentInstructionController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, paymentInstructionController.insertPayment);
router.put('/update/:id', middlewares.authorize, paymentInstructionController.updatePayment);
router.delete('/delete/:id', middlewares.authorize, paymentInstructionController.deletePayment);
router.post('/getById', middlewares.authorize, paymentInstructionController.getPaymentById);
router.get('/getPaging', middlewares.authorize, paymentInstructionController.getPaging);

module.exports = router;