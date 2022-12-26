const express = require('express');
const roleController = require('../../controllers/authentication/roleController');
const router = express.Router();
const middlewares = require('../middlewares');

router.post('/insert', middlewares.authorize, roleController.createRole);
router.put('/update/:id', middlewares.authorize, roleController.updateRole);
router.delete('/delete/:id', middlewares.authorize, roleController.deleteRole);
router.get('/getPaging', roleController.getPagingRoles);
router.get('/getById/:id', roleController.getRoleById);
module.exports = router;