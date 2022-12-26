require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let PaymentSchema = new Schema({
    code: {
        type: String,
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String,
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedTime: {
        type: Date
    },
}, {versionKey: false});

PaymentSchema.index({'name': 'text'});

module.exports = mongoose.model('PayementInstructions', PaymentSchema)