require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let ServerSchema = new Schema({
    code: {
        type: String,
    },
    serverName: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true,
    },
    cpu: {
        type: String,
    },
    ram: {
        type: String,
    },
    ssd: {
        type: String,
    },
    bandwidth: {
        type: String,
    },
    tranfer: {
        type: String,
    },
    ipv4: {
        type: String,
    },
    serverDefault: {
        type: Boolean,
        required: true,
    },
    expiryDateType: {
        type: Number,
    },
    discount: {
        type: Number,
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedTime: {
        type: Date
    },
}, {versionKey: false});

ServerSchema.index({'serverName': 'text'});

module.exports = mongoose.model('Servers', ServerSchema)
