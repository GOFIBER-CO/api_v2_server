const socketService = require("../controllers/socketService");

module.exports = (io) =>
  io.on("connection", socketService.connected)