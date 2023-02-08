const userModel = require("../../database/entities/authentication/Users");
const cloudVps = require("../../database/entities/CloudServers");
const supportModel = require("../../database/entities/Supports");
const transactionModel = require("../../database/entities/TransactionHistorys")

class StatisticController {
  async getAllUserStatistic(req, res) {
    const pageSize = req.query.pageSize || 10
    const pageIndex = req.query.pageIndex || 1
    let searchObj = {};
        if (req.query.search) {
          searchObj = {
            userName: { $regex: ".*" + req.query.search + ".*" },
          };
        }
    try {
      const users = await userModel.find(searchObj)
      .skip(pageSize * pageIndex - pageSize)
      .limit(parseInt(pageSize))
      .sort({
        createdAt: "desc",
      });
      const returnResult = await Promise.all(
        users.map(async (item) => {
          const [numberOfCloudVps, numberOfTicketSent, numberOfTicketSolved, priceUsed] =
            await Promise.all([
              cloudVps.find({ user: item._id }).countDocuments(),
              supportModel.find({ user: item._id }).countDocuments(),
              supportModel.find({ user: item._id, status: 2 }).countDocuments(),
              transactionModel.aggregate([{
                $group: {
                    _id: null,
                    sum:{
                        $sum: "$price"
                    }
                }
              }])
            ]);
            return {
                userId: item._id,
                userName: item.userName,
                code: item.code,
                email: item.email,
                numberOfCloudVps: numberOfCloudVps,
                numberOfTicketSent: numberOfTicketSent,
                numberOfTicketSolved: numberOfTicketSolved,
                priceUsed: priceUsed
            }
        })
      );
      const count = await userModel.find(searchObj).countDocuments()
      let totalPages = Math.ceil(count / pageSize);
      return res.status(200).json({
        statistic: returnResult,
        totalPages:  totalPages, 
        totalItem:  count, 
        pageSize: pageSize, 
        pageIndex: pageIndex
      })
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error });
    }
  }
}

module.exports = new StatisticController()
