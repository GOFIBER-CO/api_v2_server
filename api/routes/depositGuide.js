const router = require('express').Router()
const depositController = require('../controllers/depositGuideController')
const {createAction} = require('./actionMiddleWare')
const { authorize } = require('./middlewares')

router.get('/', depositController.getDepositGuide)
router.put('/update/:id', authorize, createAction('Thay đổi nội dung hướng dẫn nạp tiền'),depositController.updateDepositGuide)

module.exports = router