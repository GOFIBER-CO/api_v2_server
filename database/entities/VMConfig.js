require("../database");
const mongoose = require("mongoose");

const { Schema } = mongoose;

let VMConfigchema = new Schema(
  {
    // ID kiểm tra góc 
    ParentCheckpointId: {
      type: String,
    },
    //Name kiểm tra góc
    ParentCheckpointName: {
      type: String,
    },
    //Name máy ảo
    VMName: {
      type: String,
    },
    //Id máy ảo
    VMId: {
      type: String,
      // unique: true,
    },
    //Điểm kiểm tra vị trí tệp
    CheckpointFileLocation: {
      type: String,
    },
    //Vị trí cấu hình
    ConfigurationLocation: {
      type: String,
    },
    //phân trang tập tin use
    SmartPagingFileInUse: {
      type: Boolean,
    },
    //phân trang tập tin đường dẫn
    SmartPagingFilePath: {
      type: String,
    },
    //vị trí ảnh chụp tập tin 
    SnapshotFileLocation: {
      type: String,
    },
    //hành động bắt đầu tự động
    AutomaticStartAction: {
      type: String,
    },
    //hành động trì hoãn
    AutomaticStartDelay: {
      type: Number,
    },
    //hành động dừng
    AutomaticStopAction: {
      type: String,
    },
    //hành động báo lỗi nghiêm trọng
    AutomaticCriticalErrorAction: {
      type: String,
    },
    //hết thời gian báo lỗi đối với lỗi nghiêm trọng
    AutomaticCriticalErrorActionTimeout: {
      type: Number,
    },
    //Điểm kiểm tra tự động đã bật
    AutomaticCheckpointsEnabled: {
      type: Boolean,
    },
    // sử dụng CPU
    CPUUsage: {
      type: Number,
    },
    //RAM
    MemoryAssigned: {
      type: Number,
    },
    //nhu cầu bộ nhớ
    MemoryDemand: {
      type: String,
    },
    //numa được căn chỉnh
    NumaAligned: {
      type: String,
    },
    //số nút numa
    NumaNodesCount: {
      type: Number,
    },
    //Đếm socket numa
    NumaSocketCount: {
      type: Number,
    },
    //
    Heartbeat: {
      type: String,
    },
    //trạng thái dịch vụ tích hợp
    IntegrationServicesState: {
      type: String,
    },
    //phiên bản dịch vụ tích hợp
    IntegrationServicesVersion: {
      type: String,
    },
    //thời gian hoạt động
    Uptime: {
      type: String,
    },
    //tình trạng hoạt động
    OperationalStatus: {
      type: String,
    },
    //tình trạng hoạt động chính
    PrimaryOperationalStatus: {
      type: String,
    },
    //tình trạng hoạt động thứ cấp
    SecondaryOperationalStatus: {
      type: String,
    },
    //tình trạng mô tả
    StatusDescriptions: {
      type: String,
    },
    //trạng thái chính mô tả
    PrimaryStatusDescription: {
      type: String,
    },
    //trạng thái phụ mô tả
    SecondaryStatusDescription: {
      type: String,
    },
    //trạng thái
    Status: {
      type: String,
    },
    //tình trạng sao chép
    ReplicationHealth: {
      type: String,
    },
    //chế độ sao chép
    ReplicationMode: {
      type: String,
    },
    //trạng thái sao chép
    ReplicationState: {
      type: String,
    },
    //đo lường tài nguyên
    ResourceMeteringEnabled: {
      type: Boolean,
    },
    //điểm kiểm tra
    CheckpointType: {
      type: String,
    },
    //loại truyền tải phiên nâng cao
    EnhancedSessionTransportType: {
      type: String,
    },
    //các nhóm
    Groups: {
      type: String,
    },
    //phiên bản
    Version: {
      type: String,
    },
    //máy ảo loại
    VirtualMachineType: {
      type: String,
    },
    //loại máy ảo phụ
    VirtualMachineSubType: {
      type: String,
    },
    //gi chú
    Notes: {
      type: String,
    },
    //tình trạng
    State: {
      type: String,
    },
    //cổng Com 1
    ComPort1: {
      type: String,
    },
    //cổng Com 2
    ComPort2: {
      type: String,
    },
    //ổ đĩa DVD
    DVDDrives: {
      type: String,
    },
    //bộ điều hợp lưu trữ kênh
    FibreChannelHostBusAdapters: {
      type: String,
    },
    //ổ đĩa mềm
    FloppyDrive: {
      type: String,
    },
    // ổ cứng
    HardDrives :{
        type: String,
    },
    //bộ chuyển đổi remote Fx
    RemoteFxAdapter :{
        type: String,
    },
    //dịch vụ tích hợp VM
    VMIntegrationService :{
        type: String,
    },
    //kích hoạt bộ nhớ động
    DynamicMemoryEnabled :{
        type: String,
    },
    //bộ nhơ tối đa
    MemoryMaximum :{
        type: String,
    },
    //bộ nhớ tối thiểu
    MemoryMinimum :{
        type: String,
    },
    //khởi động bộ nhớ
    MemoryStartup :{
        type: String,
    },
    //số lượng CPU
    ProcessorCount :{
        type: Number,
    },
    //tính năng truyền qua pin
    BatteryPassthroughEnabled :{
        type: Boolean,
    },
    //thế hệ
    Generation :{
        type: Number,
    },
    //cụm
    IsClustered :{
        type: Boolean,
    },
    // id ảnh chụp chính
    ParentSnapshotId :{
        type: String,
    },
    //tên ảnh chụp chính
    ParentSnapshotName :{
        type: String,
    },
    //
    Path :{
        type: String,
    },
    //kích thước của tệp hệ thống
    SizeOfSystemFiles :{
        type: String,
    },
    //các loại bộ đệm do khách kiểm soát
    GuestControlledCacheTypes :{
        type: Boolean,
    },
    //Không gian MappedIo bộ nhớ thấp
    LowMemoryMappedIoSpace :{
        type: String,
    },
    //không gian bộ nhớ được ánh xạ cao
    HighMemoryMappedIoSpace  :{
        type: String,
    },
    //Địa chỉ cơ sở MappedIo bộ nhớ cao
    HighMemoryMappedIoBaseAddress  :{
        type: String,
    },
    //Khóa khi ngắt kết nối
    LockOnDisconnect  :{
        type: String,
    },
    // thời gian tạo
    CreationTime  :{
        type: String,
    },
    Id  :{
        type: String,
    },
    Name  :{
        type: String,
    },
    //bộ điều hợp mạng
    NetworkAdapters  :{
        type: String,
    },
    //phiên Cim
    CimSession  :{
        type: String,
    },
    //name PC
    ComputerName  :{
        type: String,
    },
    //
    IsDeleted  :{
        type: Boolean,
    },

    createdTime: {
      type: Date,
      default: Date.now,
    },
    updatedTime: {
      type: Date,
    },
    // ssd : 30
    fileSize:{
      type:Number
    }
  },
  { versionKey: false }
);

VMConfigchema.index({ VMName: "text" });

module.exports = mongoose.model("VMConfig", VMConfigchema);
