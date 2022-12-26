const mongoose = require('mongoose')
const { Schema } = mongoose;

const OrderSchema = Schema({
    code: {
        type: String,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'Users'
    },
    totalPrice: Number,
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Servers',
    }
},{
    timestamps: true
})

module.exports = mongoose.model('Orders', OrderSchema)