require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let webSupportchema = new Schema({
    webSupportName:{
        type:String,
        required: true,
        unique: true
    },
    webSupportEmail:{
        type:String
    },
    webSupportPhone:{
        type:String
    },
    webSupportProject:{
        type:String
    },
    webSupportArray:{
        type: Array
    },

    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedTime: {
        type: Date
    },
    
}, {versionKey: false});

webSupportchema.index({'webSupportName': 'text'});

module.exports = mongoose.model('webSupports', webSupportchema)
