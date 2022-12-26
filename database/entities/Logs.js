require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let Logchema = new Schema({
    code: {
        type: String,
    },
    logName: {
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    cloudServer: {
        type: Schema.Types.ObjectId,
        ref: 'CloudServers'
    },
    status: {
        type: Number,
    },
    content: {
        type: String,
    },
    completionTime: {
        type: Date,
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedTime: {
        type: Date
    },
}, {versionKey: false});

Logchema.index({'logName': 'text'});

module.exports = mongoose.model('Logs', Logchema)
