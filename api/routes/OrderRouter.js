const router = require('express').Router()
const OrderController = require('../controllers/OrderController')
const middlewares = require('../routes/middlewares')

router.get('/', middlewares.authorize, OrderController.getAllOrder)

module.exports = router