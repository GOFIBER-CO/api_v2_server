const IpController = require('../controllers/IpController')

const router = require('express').Router()

router.get('/init-ip', IpController.initIpController)
router.get('/getPaging', IpController.getPaging)
router.patch('/:id', IpController.updateIp)
router.post('/create-ip', IpController.createIp)

module.exports = router