const router = require('express').Router()
const depositController = require('../controllers/depositGuideController')
const createAction = require('./actionMiddleWare')

router.get('/', depositController.getDepositGuide)
router.put('/update/:id', createAction('Thay đổi nội dung hướng dẫn nạp tiền'),depositController.updateDepositGuide)

module.exports = router