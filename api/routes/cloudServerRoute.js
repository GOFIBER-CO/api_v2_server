const express = require('express');
const router = express.Router();
const cloudServerController = require('../controllers/cloudServerController');
const createAction = require('./actionMiddleWare');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication, createAction('Tạo mới cloudserver'),cloudServerController.insertCloudServer);
router.put('/update/:id', middlewares.authentication, createAction('Upgrade cloudserver'),cloudServerController.updateCloudServer);
router.delete('/delete/:id', middlewares.authentication, createAction('Xoá Cloudserver'),cloudServerController.deleteCloudServer);
router.post('/getById', middlewares.authentication,cloudServerController.getCloudServerById);
router.get('/getPaging', middlewares.authentication,cloudServerController.getPaging);
router.get('/getCloudServerExpiresPaging', middlewares.authentication,cloudServerController.getCloudServerExpiresPaging);
router.get('/getCloudServerByUserId', middlewares.authentication, cloudServerController.getCloudServerByUserId);
router.get('/getCloudServerDelete', middlewares.authentication, cloudServerController.getCloudServerDelete);
router.put('/extend/:id', middlewares.authentication, createAction('Gia hạn cloud server'),cloudServerController.cloudServerExtend);
router.put('/upgradec/:id', middlewares.authentication, createAction('Upgrade cloudserver'),cloudServerController.cloudServerUpgradec);
router.patch('/switchIsAutoRenew/:id', middlewares.authentication, createAction('Đổi trạng thái gia hạn cloud server'),cloudServerController.switchAutoRenewServer)
router.delete('/deleteCloudServer/:id', middlewares.authentication, createAction('Xoá Cloudserver'),cloudServerController.softDeleteCloudServer)
router.get('/deletedCloud', middlewares.authentication, cloudServerController.getDeletedCloudServerByUser)
router.get('/aboutToExpire', middlewares.authentication,cloudServerController.getAboutToExpireCloudServer)
router.post('/renewCloudServer/:id', middlewares.authentication, cloudServerController.cloudServerExtend)
router.put('/update/name/:id', cloudServerController.updateNameCloudById)
//
router.get('/getById/:id', cloudServerController.getCloudServersById)
router.put('/server/update/:id', cloudServerController.updateDataOfServerInCloudServerById)

module.exports = router;