const mongoose = require("mongoose");

const ActionHistory = mongoose.Schema({
  action: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  status: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  successAt: {
    type: Date,
  },
});

module.exports = mongoose.model("actionhistorys", ActionHistory);
