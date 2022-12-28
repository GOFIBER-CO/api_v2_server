const express = require('express');
const router = express.Router();
const cloudServerController = require('../controllers/cloudServerController');
const middlewares = require('./middlewares');

router.post('/insert', middlewares.authentication,cloudServerController.insertCloudServer);
router.put('/update/:id', middlewares.authentication, cloudServerController.updateCloudServer);
router.delete('/delete/:id', middlewares.authentication, cloudServerController.deleteCloudServer);
router.post('/getById', middlewares.authentication, cloudServerController.getCloudServerById);
router.get('/getPaging', middlewares.authentication,cloudServerController.getPaging);
router.get('/getCloudServerExpiresPaging', middlewares.authentication,cloudServerController.getCloudServerExpiresPaging);
router.get('/getCloudServerByUserId', middlewares.authentication, cloudServerController.getCloudServerByUserId);
router.get('/getCloudServerDelete', middlewares.authentication, cloudServerController.getCloudServerDelete);
router.put('/extend/:id', middlewares.authentication, cloudServerController.cloudServerExtend);
router.put('/upgradec/:id', middlewares.authentication, cloudServerController.cloudServerUpgradec);
router.patch('/switchIsAutoRenew/:id', middlewares.authentication, cloudServerController.switchAutoRenewServer)
router.delete('/deleteCloudServer/:id', middlewares.authentication, cloudServerController.softDeleteCloudServer)
router.get('/deletedCloud', middlewares.authentication, cloudServerController.getDeletedCloudServerByUser)
router.get('/aboutToExpire', middlewares.authentication,cloudServerController.getAboutToExpireCloudServer)
router.post('/renewCloudServer/:id', middlewares.authentication, cloudServerController.cloudServerExtend)
router.put('/update/name/:id', cloudServerController.updateNameCloudById)
module.exports = router;