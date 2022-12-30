const express = require('express');
const router = express.Router();
const webSupportController = require('../controllers/webSupportController');

router.post('/insert',webSupportController.insertWebSupport);
module.exports = router;