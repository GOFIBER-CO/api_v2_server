const express = require('express');
const router = express.Router();
const snapshotController = require('../controllers/snapshotController');
const {createAction} = require('./actionMiddleWare');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication, createAction("Tạo snapshot"),snapshotController.createSnapshot);
router.put('/update/:id', middlewares.authentication, createAction("Cập nhật snapshot"),snapshotController.updateSnapshot);
router.delete('/delete/:id', middlewares.authentication, createAction("Xoá snapshot"),snapshotController.deleteSnapshot);
router.get('/getById/:id', middlewares.authentication, snapshotController.getSnapshotById);
router.get('/getPaging', middlewares.authentication, snapshotController.getPagingSnapshot);
router.get('/getSnapshotsByUserId', middlewares.authentication, snapshotController.getSnapshotByUserId);

module.exports = router;






