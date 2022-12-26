require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let OperatingSystemchema = new Schema({
    code: {
        type: String,
    },
    operatingSystemName: {
        type: String,
        required: true,
        unique: true
    },
    parentID: {
        type: String,
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

OperatingSystemchema.index({'operatingSystemName': 'text'});

module.exports = mongoose.model('OperatingSystems', OperatingSystemchema)
