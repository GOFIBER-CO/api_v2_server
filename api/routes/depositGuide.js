const router = require('express').Router()
const depositController = require('../controllers/depositGuideController')

router.get('/', depositController.getDepositGuide)
router.put('/update/:id', depositController.updateDepositGuide)

module.exports = router