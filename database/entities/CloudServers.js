require("../database");
const mongoose = require("mongoose");

const { Schema } = mongoose;

let CloudServerchema = new Schema(
  {
    code: {
      type: String,
    },
    ip:{
      type: mongoose.Types.ObjectId,
      ref: 'ips', 
    },
    cloudKey:{
      type: String,
    },
    clusterName: {
      type: String,
    },
    cloudServerName: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    port: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    area: {
      type: Schema.Types.ObjectId,
      ref: "Areas",
    },
    operatingSystem: {
      type: Schema.Types.ObjectId,
      ref: "OperatingSystems",
    },
    server: {
      type: Schema.Types.ObjectId,
      ref: "Servers",
    },
    status: {
      type: String,
      default: 'not-active',
    },
    expiryDate: {
      type: Date,
    },
    createdTime: {
      type: Date,
      default: Date.now,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Orders",
    },
    updatedTime: {
      type: Date,
    },
    isAutoRenew: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    autoBackup: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false }
);

CloudServerchema.index({ cloudServerName: "text" });

module.exports = mongoose.model("CloudServers", CloudServerchema);
