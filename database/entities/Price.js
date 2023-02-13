const mongoose = require('mongoose')

const Price = mongoose.Schema({
    ram: {
        type: Number,
        required: true,
    },
    ssd: {
        type: Number, 
        required: true,
    },
    cpu: {
        type: Number, 
        required: true,
    }
})

module.exports = mongoose.model('prices', Price)