const mongoose = require("mongoose");

const ActionHistory = mongoose.Schema({
  action: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  createdAt: {
    type: String,
  },
  successAt: {
    type: String,
  },
});

module.exports = mongoose.model("actionhistorys", ActionHistory);
