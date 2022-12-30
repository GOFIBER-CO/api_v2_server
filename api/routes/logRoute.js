const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication,logController.insertLog);
router.put('/update/:id', middlewares.authentication, logController.updateLog);
router.delete('/delete/:id', middlewares.authentication, logController.deleteLog);
router.post('/getById', middlewares.authentication, logController.getLogById);
router.get('/getPaging', middlewares.authentication, logController.getPaging);
router.get('/getLogByUserId', middlewares.authentication, logController.getLogByUserId);

module.exports = router;