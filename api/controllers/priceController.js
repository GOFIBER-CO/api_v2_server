const priceModel = require('../../database/entities/Price')
class PriceController {
    async initPrice(){
        try {
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: 'Failed'})
        }
    }
}

module.exports = new PriceController()

