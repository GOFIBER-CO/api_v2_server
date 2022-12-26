const mongoose = require('mongoose')

const DepositGuide = mongoose.Schema({
    content: {
        type: String,
    }
})

module.exports = mongoose.model('depositguides', DepositGuide)