require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let NotiSchema = new Schema({
    code:{
        type: String,
    },
    name: {
        type: String,
    },
    slug: {
        type: String,
    },
    type: {
        type: String,
    },
    reciever:[{
        type: mongoose.Types.ObjectId, 
        ref: 'Users'
    }],
    sender:{
        type: mongoose.Types.ObjectId,
        ref: 'Users'
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
    status: {
        type: Boolean,
        default: false
    }
}, {versionKey: false});

NotiSchema.index({'name': 'text'});

module.exports = mongoose.model('Notification', NotiSchema)
