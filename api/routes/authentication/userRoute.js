const express = require('express');
const router = express.Router();
const userController = require('../../controllers/authentication/userController');
const createAction = require('../actionMiddleWare');
const middlewares = require('../middlewares');


router.post('/login', userController.login);
router.post('/insert', userController.insertUser);
router.post('/register', userController.register);
router.put('/update/:id', middlewares.authentication, userController.updateUser);
router.delete('/delete/:id', middlewares.authorize, userController.deleteUser);
router.post('/getById', middlewares.authentication, userController.getUserById);
router.get('/getPaging', middlewares.authorize, userController.getPaging);
router.post('/forgotPassword', middlewares.authorize, userController.forgotPassword);
router.post('/changePassword', middlewares.authentication,createAction("Đổi mật khẩu"),userController.changePassword);
router.get('/getUserByRole', middlewares.authorize,userController.getUserByRole);
router.get('/getQrCode/:id', middlewares.authentication,userController.getQrCode)
router.post('/verify2FaToken',  middlewares.authentication, userController.verify2FaToken)
router.post('/login2Fa',  middlewares.authentication,userController.login2Fa)
router.get('/surplus/:id', middlewares.authentication,userController.getSurplus)
router.get('/getAllUser', middlewares.authorize, userController.getAllUser)
router.patch('/disabled2fa/:id', middlewares.authentication, createAction("Tắt chức năng bảo mật 2 lớp"),userController.disabled2Fa)

module.exports = router;