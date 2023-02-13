const socketService = require("../controllers/socketService");
const jwt = require('jsonwebtoken');

module.exports = (io) =>{
  io.use((socket, next) => {
    const secretKey = process.env.SECRET_KEY
    const token = socket.handshake.auth.token;
    jwt.verify(token, secretKey, async (err, authorizedData) => {
      if (err) {
        next(new Error('Authentication error'));
      } else {
        if (authorizedData._id) {
          socket.userId = authorizedData._id
          next()
        }
      }
    });
  })
  io.on("connection", socketService.connected)

}