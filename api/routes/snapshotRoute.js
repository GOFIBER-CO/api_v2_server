const express = require('express');
const router = express.Router();
const snapshotController = require('../controllers/snapshotController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication, snapshotController.createSnapshot);
router.put('/update/:id', middlewares.authentication, snapshotController.updateSnapshot);
router.delete('/delete/:id', middlewares.authentication, snapshotController.deleteSnapshot);
router.get('/getById/:id', middlewares.authentication, snapshotController.getSnapshotById);
router.get('/getPaging', middlewares.authentication, snapshotController.getPagingSnapshot);
router.get('/getSnapshotsByUserId', middlewares.authentication, snapshotController.getSnapshotByUserId);

module.exports = router;






