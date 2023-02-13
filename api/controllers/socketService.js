let onlineUser = [];
const Socket = require('../../database/entities/Socket');
const socketModel = require('../../database/entities/Socket')
class SocketService {
  async connected(socket) {
    console.log('user connected')
    const socketId = await Socket.findOne({user: socket.userId})
    if(!socketId){
      const updateSocketId = await Socket.create({
        user: socket.userId, 
        socket: socket.id
      })
    }

    const updateSocketId = await Socket.findOneAndUpdate({user: socket.userId}, {
      $addToSet: {
        socketId: socket.id
      }
    })
  
    socket.on("disconnect", async () => {
      onlineUser = onlineUser.filter((item) => item.id != socket.id);
      const updateSocketId = await Socket.findOneAndUpdate({user: socket.userId}, {
       socketId: []
      })
    });

    socket.on("user connect", (msg) => {
      const check = onlineUser.some(
        (item) => item.userId == msg.userId && item.id == socket.id
      );
      if (!check) {
        onlineUser.push({ userId: msg.userId, id: socket.id });
      }
    });
  }

  getOnlineUser() {
    return onlineUser;
  }
}

module.exports = new SocketService();
