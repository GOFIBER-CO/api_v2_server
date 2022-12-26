const express = require('express');
const router = express.Router();
const middlewares = require('../middlewares');
const actionController = require('../../controllers/authentication/actionController');

router.post('/insert', middlewares.authorize, actionController.createAction);
router.put('/update/:id', middlewares.authorize, actionController.updateAction);
router.delete('/delete/:id', middlewares.authorize, actionController.deleteAction);
router.get('/getPaging', actionController.getPagingActions);
router.get('/getById/:id', actionController.getActionById);
module.exports = router;