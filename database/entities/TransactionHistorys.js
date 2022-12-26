require('../database');
const mongoose = require('mongoose');

const { Schema } = mongoose;

let TransactionHistorychema = new Schema({
    code: {
        type: String,
    },
    transactionHistoryName: {
        type: String,
    },
    content: {
        type: String,
    },
    balanceBeforeTransaction: {
        type: Number,
    },
    price: {
        type: Number,
    },
    balanceAfterTransaction: {
        type: Number,
    },
    status: {
        type: Number,   
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    cloudServer: {
        type: Schema.Types.ObjectId,
        ref: 'CloudServers'
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    updatedTime: {
        type: Date
    },
}, {versionKey: false});
TransactionHistorychema.index({'transactionHistoryName': 'text'});

module.exports = mongoose.model('TransactionHistorys', TransactionHistorychema)
