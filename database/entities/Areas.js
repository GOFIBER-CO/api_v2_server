require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let Areachema = new Schema({
    code: {
        type: String,
    },
    areaName: {
        type: String,
        required: true,
        unique: true
    },
    country: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
    },
    file: {
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

Areachema.index({'areaName': 'text'});

module.exports = mongoose.model('Areas', Areachema)
