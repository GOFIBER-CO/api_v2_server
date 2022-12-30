const ActionHistoryModel = require('../../database/entities/ActionHistory')

class ActionHistroyController {
    async updateActionHistory(id, status){
        try {
            const action = await ActionHistoryModel.findByIdAndUpdate(id, {
                status: status
            })
        } catch (error) {
            console.log(error)
        }
    }

    async getActionHistroryByUserId(req, res){
        try {
            const pageSize = req.query.pageSize || 10
            const pageIndex = req.query.pageIndex || 1
            const action = await ActionHistoryModel.find({
                user: req.params.userId
            }).skip((pageSize * pageIndex) - pageSize).limit(pageSize).populate('user')
            const count = await ActionHistoryModel.find({
                user: req.params.userId
            }).countDocuments()
            return res.status(200).json({actions: action, pageSize: pageSize, pageIndex: pageIndex,totalDoc: count, totalPage: Math.ceil(count/pageSize)})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: error})
        }
    }
    
    async getPaging(req, res){
        try {
            const pageSize = req.query.pageSize || 10
            const pageIndex = req.query.pageIndex || 1

            const action = await ActionHistoryModel.find({}).skip((pageSize * pageIndex) - pageSize).limit(pageSize).populate('user')
            return res.status(200).json({actions: action})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: error})
        }
    }
}

module.exports = new ActionHistroyController()