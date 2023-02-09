const mongoose = require('mongoose')

const Price = mongoose.Schema({
    objectName: {
        type: String,
        required: true,
    },
    price: {
        type: String, 
        required: true,
    }
})

module.exports = mongoose.model('prices', Price)