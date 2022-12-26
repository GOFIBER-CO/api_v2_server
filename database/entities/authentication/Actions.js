require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let actionSchema = new Schema({
    code: {
        type: String,
    },
    actionName: {
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
    }
}, {versionKey: false});
actionSchema.index({'actionName': 'text'});

module.exports = mongoose.model('Actions', actionSchema)
