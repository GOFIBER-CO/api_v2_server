var mongoose = require("mongoose");
class Database {
  constructor() {
    this._connect();
  }
  _connect() {
    let mongodbURL = `mongodb+srv://admin:KgozTdmTaKtIrePV@serverdev.zz2zpg2.mongodb.net/?retryWrites=true&w=majority`;
    mongoose
      .connect(mongodbURL)
      .then(() => {
        console.log("Database connection successful");
      })
      .catch((err) => {
        console.error("Database connection error");
      });
  }
}

module.exports = new Database();
