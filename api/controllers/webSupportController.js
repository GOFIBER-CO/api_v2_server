
const ResponseModel = require("../models/ResponseModel");
const webSupports = require("../../database/entities/WebSupport");


async function insertWebSupport(req, res) {
    try {
        const webSupport = new webSupports(req.body);
        webSupport.createdTime = Date.now();
        webSupport.save((err, newWebSupports) => {
          if (err) {
            let response  = new ResponseModel(-1, err.message, err);
            return res.json(response);
          }
        });
        if (req.body.webSupportEmail) {
            if (req.body.webSupportName) {
              const nodemailer = require("nodemailer");
              const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: "phuongnhgcs200104@fpt.edu.vn",
                  pass: "ghrvzbxwpqtaovgm",
                },
              });
              const textSendMail = `<h1>Thiết kế website ${req.body.webSupportArray} </h1><br>
                                   <div>Tên: ${req.body.webSupportName}</div>
                                   <div>Email: ${req.body.webSupportEmail}</div>
                                   <div>Số điện thoại: ${req.body.webSupportPhone}</div>
                                   <div>Vấn đề: ${req.body.webSupportProject}</div>                                   
                                   `;
        
              const mailOptions = {
                from: "phuongnhgcs200104@fpt.edu.vn",
                to: "sales@gofiber.vn",
                subject: "Hỗ trợ Gofiber",
                html: textSendMail,
              };
              await transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                //   console.log(error)
                  let response = new ResponseModel(404, error.response, error);
                //   console.log(response,'res');
                 return res.status(404).json(response);
                } else {
                  let response = new ResponseModel(
                    1,
                    "Send mail success!",
                    req.body.webSupportEmail
                  );
                  return res.json(response);
                }
              });
            } else {
              let response = new ResponseModel(0, "User was not found", null);
              return res.json(response);
            }
          } else {
            let response = new ResponseModel(0, "webSupportEmail was not found", null);
            return res.json(response);
          }
      } catch (error) {
        let response = new ResponseModel(404, error.message, error);
        return res.status(404).json(response);
      }
}

exports.insertWebSupport = insertWebSupport;