const mongoose = require("mongoose");


const Ip = mongoose.Schema({
    ip: {
        type:String,
        required: true
    },
    status: {
        type: Boolean,
        default: true,
    }
},{
    timestamps: true,
})

module.exports = mongoose.model('ips', Ip)