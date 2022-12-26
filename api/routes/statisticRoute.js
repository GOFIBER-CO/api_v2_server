const router = require('express').Router()
const statisticController = require('../controllers/statisticController')
const middlewares = require('./middlewares')

router.get('/', middlewares.authorize, statisticController.getAllUserStatistic)

module.exports = router