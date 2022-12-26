const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication, supportController.insertSupport);
router.put('/update/:id', middlewares.authorize, supportController.updateSupport);
router.delete('/delete/:id', middlewares.authorize, supportController.deleteSupport);
router.post('/getById', middlewares.authorize, supportController.getSupportById);
router.get('/getSupportByUserId', middlewares.authentication, supportController.getSupportByUserId);
router.get('/getPaging', middlewares.authorize, supportController.getPaging);


module.exports = router;