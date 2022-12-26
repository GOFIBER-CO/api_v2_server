const express = require('express');
const router = express.Router();
const operatingSystemController = require('../controllers/operatingSystemController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, operatingSystemController.insertOperatingSystem);
router.put('/update/:id', middlewares.authorize, operatingSystemController.updateOperatingSystem);
router.delete('/delete/:id', middlewares.authorize, operatingSystemController.deleteOperatingSystem);
router.post('/getById', middlewares.authentication, operatingSystemController.getOperatingSystemById);
router.get('/getPaging', middlewares.authentication, operatingSystemController.getPaging);
router.get('/getOperatingSystem', middlewares.authentication, operatingSystemController.getOperatingSystem);
router.get('/getOperatingSystemChildren', middlewares.authentication, operatingSystemController.getOperatingSystemChildren);

module.exports = router;