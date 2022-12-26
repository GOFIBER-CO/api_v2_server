const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authorize, areaController.insertArea);
router.put('/update/:id', middlewares.authorize, areaController.updateArea);
router.delete('/delete/:id', middlewares.authorize, areaController.deleteArea);
router.post('/getById', middlewares.authentication, areaController.getAreaById);
router.get('/getPaging', middlewares.authentication, areaController.getPaging);
router.get('/getAllLocations', middlewares.authentication, areaController.getAllLocations)

module.exports = router;