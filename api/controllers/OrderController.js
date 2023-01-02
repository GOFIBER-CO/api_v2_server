const orderModel = require("../../database/entities/Order");
const Users = require("../../database/entities/authentication/Users");

class OrderController {
  async createOrder(req, res) {
    try {
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Server Error" });
    }
  }

  async getAllOrder(req, res) {
    const pageSize = req.query.pageSize || 10;
    const pageIndex = req.query.pageIndex || 1;
    let searchObj = {};
    if (req.query.search) {
      searchObj = {
        userName: { $regex: ".*" + req.query.search + ".*" },
      };
    }
    let searchObjOrder = {}
    if(req.query.timeFrom && req.query.timeTo){
      searchObjOrder.createdAt = {
        $gte: new Date(req.query.timeFrom), 
        $lt: new Date(req.query.timeTo),
      }
    }

    try {
      const user = await Users.find(searchObj);
      const listUserId = user.map((item) => item._id.toString());
      searchObjOrder.user = {
        $in: listUserId
      }
      const result = await orderModel
        .find(searchObjOrder)
        .populate('user')
        .populate('product')
        .skip(pageSize * pageIndex - pageSize)
        .limit(parseInt(pageSize))
        .sort({
          createdAt: "desc",
        });
      const count = await Users.find(searchObj).countDocuments()
      let totalPages = Math.ceil(count / pageSize);
      return res
        .status(200)
        .json({
          order: result,
          pageSize: pageSize,
          pageIndex: pageIndex,
          totalItem: count <99 ? 150 : count,
          totalPages: totalPages < 10 ? 10 :totalPages ,
        });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error });
    }
  }

  async getOrderByUserId(req, res) {
    if (!req.params.id)
      return res.status(403).json({ message: "Thiếu dữ liệu đầu vào" });
    try {
      const result = await orderModel.find({ user: req.params.id });
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error });
    }
  }
}

module.exports = new OrderController();
