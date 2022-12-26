require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let roleSchema = new Schema({
    code: {
        type: String,
    },
    roleName: {
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
roleSchema.index({'roleName': 'text'});

module.exports = mongoose.model('Roles', roleSchema)