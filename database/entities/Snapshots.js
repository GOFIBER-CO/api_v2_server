require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let Snapshotchema = new Schema({
    code: {
        type: String,
    },
    content: {
        type: String,
    },
    status: {
        type: Number,
    },
    cloudServer: {
        type: Schema.Types.ObjectId,
        ref: 'CloudServers'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedTime: {
        type: Date
    },
}, {versionKey: false});

Snapshotchema.index({'code': 'text'});

module.exports = mongoose.model('Snapshots', Snapshotchema)
