const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication,serverController.insertServer);
router.put('/update/:id', middlewares.authentication,serverController.updateServer);
router.delete('/delete/:id', middlewares.authorize,serverController.deleteServer);
router.post('/getById', middlewares.authentication,serverController.getServerById);
router.get('/getPaging', middlewares.authentication,serverController.getPaging);

module.exports = router;