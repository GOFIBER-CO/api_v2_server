const router = require('express').Router()
const actionhistorysController = require('../controllers/actionHistoryController')
const authMiddleware = require('../routes/middlewares')

router.get('/getPaging', authMiddleware.authentication,actionhistorysController.getPaging)
router.get('/getByUserId/:userId', authMiddleware.authentication, actionhistorysController.getActionHistroryByUserId)

module.exports = router