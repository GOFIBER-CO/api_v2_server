const router = require('express').Router()
const priceController = require('../controllers/priceController')

router.post('/init', priceController.initPrice)
router.get('/', priceController.getPrice)
router.put('/:id', priceController.updatePrice)
router.get('/:id',priceController.getPriceById)

module.exports = router