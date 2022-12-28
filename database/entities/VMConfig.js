require("../database");
const mongoose = require("mongoose");

const { Schema } = mongoose;

let VMConfigchema = new Schema(
  {
    ParentCheckpointId: {
      type: String,
    },
    ParentCheckpointName: {
      type: String,
    },
    VMName: {
      type: String,
    },
    VMId: {
      type: String,
      unique: true,
    },
    CheckpointFileLocation: {
      type: String,
    },
    ConfigurationLocation: {
      type: String,
    },
    SmartPagingFileInUse: {
      type: Boolean,
    },
    SmartPagingFilePath: {
      type: String,
    },
    SnapshotFileLocation: {
      type: String,
    },
    AutomaticStartAction: {
      type: String,
    },
    AutomaticStartDelay: {
      type: Number,
    },
    AutomaticStopAction: {
      type: String,
    },
    AutomaticCriticalErrorAction: {
      type: String,
    },
    AutomaticCriticalErrorActionTimeout: {
      type: Number,
    },
    AutomaticCheckpointsEnabled: {
      type: Boolean,
    },
    CPUUsage: {
      type: Number,
    },
    MemoryAssigned: {
      type: Number,
    },
    MemoryDemand: {
      type: String,
    },
    NumaAligned: {
      type: String,
    },
    NumaNodesCount: {
      type: Number,
    },
    NumaSocketCount: {
      type: Number,
    },
    Heartbeat: {
      type: String,
    },
    IntegrationServicesState: {
      type: String,
    },
    IntegrationServicesVersion: {
      type: String,
    },
    Uptime: {
      type: String,
    },
    OperationalStatus: {
      type: String,
    },
    PrimaryOperationalStatus: {
      type: String,
    },
    SecondaryOperationalStatus: {
      type: String,
    },
    StatusDescriptions: {
      type: String,
    },
    PrimaryStatusDescription: {
      type: String,
    },
    SecondaryStatusDescription: {
      type: String,
    },
    Status: {
      type: String,
    },
    ReplicationHealth: {
      type: String,
    },
    ReplicationMode: {
      type: String,
    },
    ReplicationState: {
      type: String,
    },
    ResourceMeteringEnabled: {
      type: Boolean,
    },
    CheckpointType: {
      type: String,
    },
    EnhancedSessionTransportType: {
      type: String,
    },
    Groups: {
      type: String,
    },
    Version: {
      type: String,
    },
    VirtualMachineType: {
      type: String,
    },
    VirtualMachineSubType: {
      type: String,
    },
    Notes: {
      type: String,
    },
    State: {
      type: String,
    },
    ComPort1: {
      type: String,
    },
    ComPort2: {
      type: String,
    },
    DVDDrives: {
      type: String,
    },
    FibreChannelHostBusAdapters: {
      type: String,
    },
    FloppyDrive: {
      type: String,
    },

    createdTime: {
      type: Date,
      default: Date.now,
    },
    updatedTime: {
      type: Date,
    },
  },
  { versionKey: false }
);

VMConfigchema.index({ VMName: "text" });

module.exports = mongoose.model("VMConfig", VMConfigchema);
