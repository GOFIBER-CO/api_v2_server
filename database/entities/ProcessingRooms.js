require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let ProcessingRoomchema = new Schema({
    code: {
        type: String,
    },
    processingRoomName: {
        type: String,
        required: true,
        unique: true
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedTime: {
        type: Date
    },
}, {versionKey: false});

ProcessingRoomchema.index({'processingRoomName': 'text'});

module.exports = mongoose.model('ProcessingRooms', ProcessingRoomchema)
