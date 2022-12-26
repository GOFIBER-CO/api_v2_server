require('../../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let userSchema = new Schema({
    code: {
        type: String,
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        default: 'unknown'
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    sex: {
        type: String,
        default: 'male'
    },
    surplus: {
        type: Number,
        default: 0,
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Roles'
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedTime: {
        type: Date
    },
    isEnable2FaAuthenticate: {
        type: Boolean,
        default: false
    },
    secret: {
        type: String,
        default: '',
    },
    isCustomer: {
        type: Boolean,
        default: true,
    }
}, {versionKey: false});

userSchema.index({'userName': 'text'});

module.exports = mongoose.model('Users', userSchema)
