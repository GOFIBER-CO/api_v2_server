const priceModel = require('../../database/entities/Price')
class PriceController {
    async initPrice(req, res){
        try {
            const price = {
                ram: 20000,
                ssd: 20000,
                cpu: 20000,
            }

            const newPrice = await priceModel.create(price)
            return res.status(200).json(newPrice)
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: 'Failed'})
        }
    }

    async getPrice(req, res){
        try {
            const result = await priceModel.find({})
            const price = result?.[0]
            return res.status(200).json({message: "Success", price: price})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: 'Failed'})
        }
    }

    async updatePrice(req, res){
        try {
            const price = await priceModel.findByIdAndUpdate(req.params.id, {
                ram: req.body.ram,
                ssd: req.body.ssd,
                cpu: req.body.cpu
            })
            return res.status(200).json({message: "success", price: price})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "Failed"})
        }
    }

    async getPriceById(req, res) {
        try {
            const result = await priceModel.findById(req.params.id)
            return res.status(200).json({price: result})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "Failed"})
        }
    }
}

module.exports = new PriceController()

