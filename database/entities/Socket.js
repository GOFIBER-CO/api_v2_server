const mongoose = require('mongoose')

const Socket = mongoose.Schema({
    user: [
        {
            type: mongoose.Types.ObjectId,
            default: []
        }
    ],
    socketId: [
        {
            type: String,
            default: []
        }
    ]
},{timestamps: true})

module.exports = mongoose.model('sockets', Socket)