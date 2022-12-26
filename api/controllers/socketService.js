let onlineUser = []

class SocketService {

    connected(socket){
        console.log('User connected')

        socket.on('disconnect',  ()  =>  {
            onlineUser = onlineUser.filter(item => item.id != socket.id)
        })

        socket.on('user connect', (msg) => {
            const check = onlineUser.some(item => item.userId == msg.userId && item.id == socket.id)
            if(!check){
                onlineUser.push({userId: msg.userId, id: socket.id})
            }
        })
    }

    getOnlineUser(){
        return onlineUser
    }
}

module.exports = new SocketService()