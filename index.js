const express = require('express');
const bodyParser = require('body-parser');
require("dotenv").config();
const morgan = require('morgan');
const fileUpload = require('express-fileupload')
var cors = require('cors');
const app = express();
const origin = ['https://v2.vngserver.vn', 'http://localhost:3030', 'http://localhost:8078']

app.use(morgan('combined'));
app.use(cors({
    origin: origin
}));
app.options('*', cors());
app.use(fileUpload())
app.use(express.static('public'))
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false }));

const port = process.env.PORT;
const userRoute = require('./api/routes/authentication/userRoute');
const serverRoute = require('./api/routes/serverRoute');
const areaRoute = require('./api/routes/areaRoute');
const operatingSystemRoute = require('./api/routes/operatingSystemRoute');
const cloudServerRoute = require('./api/routes/cloudServerRoute');
const processingRoomRoute = require('./api/routes/processingRoomRoute');
const roleRoute = require('./api/routes/authentication/roleRoute');
const actionRoute = require('./api/routes/authentication/actionRoute');
const roleActionRoute = require('./api/routes/authentication/roleActionRoute');
const supportRoute = require('./api/routes/supportRoute');
const paymentInstructionRoute = require('./api/routes/paymentInstructionRoute');
const notificationRoute = require('./api/routes/notificationRoute');
const transactionHistoryRoute = require('./api/routes/transactionHistoryRoute');
const logRoute = require('./api/routes/logRoute');
const orderRouter = require('./api/routes/OrderRouter')
const depositGuideRouter = require('./api/routes/depositGuide')
const statisticRouter = require('./api/routes/statisticRoute')
const socket = require('./api/socket');
const snapshotRoute = require('./api/routes/snapshotRoute');
const { autoRenewCloudServer, notifyCloudServerAboutToExpire } = require('./api/controllers/cloudServerController');

//import routes
app.use('/api/user', userRoute);
app.use('/api/server', serverRoute);
app.use('/api/area', areaRoute);
app.use('/api/operatingSystem', operatingSystemRoute);
app.use('/api/cloudServer', cloudServerRoute);
app.use('/api/processingRoom', processingRoomRoute);
app.use('/api/role', roleRoute);
app.use('/api/action', actionRoute);
app.use('/api/roleAction', roleActionRoute);
app.use('/api/support', supportRoute);
app.use('/api/paymentInstruction', paymentInstructionRoute);
app.use('/api/notification', notificationRoute);logRoute
app.use('/api/transactionHistory', transactionHistoryRoute);
app.use('/api/log', logRoute);
app.use('/api/deposit-guide', depositGuideRouter)
app.use('/api/statistic', statisticRouter)
app.use('/api/order', orderRouter)
app.use('/api/snapshot', snapshotRoute)


const server = require('http').Server(app)
const io = require('socket.io')(server ,{
    cors: '*'
})

autoRenewCloudServer()
notifyCloudServerAboutToExpire()

socket(io)

global._io = io

server.listen(port, (req, res) => {
    console.log('server listening on port ' + port);
});