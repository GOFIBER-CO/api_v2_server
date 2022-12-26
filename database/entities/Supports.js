require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let Supportchema = new Schema({
    code: {
        type: String,
    },
    supportName: {
        type: String,
        required: true,
        default: 0,
    },
    level: {
        type: Number,
    },
    processingRoom: {
        type: Schema.Types.ObjectId,
        ref: 'ProcessingRooms'
    },
    title: {
        type: String,
    },
    content: {
        type: String,
        default: ''
    },
    file: {
        type: String,
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
    status: {
        type:Number,
        default: 0,
    },
    feedBack:{
        type: String,
        default: 0,
    },
    modifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    }
}, {versionKey: false});

Supportchema.index({'supportName': 'text'});

module.exports = mongoose.model('Supports', Supportchema)
