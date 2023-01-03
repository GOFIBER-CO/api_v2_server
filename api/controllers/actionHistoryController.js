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
            }).skip((pageSize * pageIndex) - pageSize).limit(pageSize).populate('user').sort({createdAt: 'desc'})
            const count = await ActionHistoryModel.find({
                user: req.params.userId
            }).countDocuments()
            return res.status(200).json({actions: action, pageSize: pageSize, pageIndex: pageIndex,totalDoc: count < 99 ? 150: count, totalPage: Math.ceil(count/pageSize) < 10 ?10 :Math.ceil(count/pageSize) })
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: error})
        }
    }
    
    async getPaging(req, res){
        try {
            const pageSize = req.query.pageSize || 10
            const pageIndex = req.query.pageIndex || 1
            let searchObj = {}
            const action = await ActionHistoryModel.find(searchObj).skip(pageIndex).limit((pageSize * pageIndex) - pageSize).populate('user')
            .skip(pageSize * pageIndex - pageSize)
            .limit(parseInt(pageSize))
            .sort({
                createdTime: "desc",
            });
            let returnResult = []
            if(req.query.filter){
                action.map(item => {
                    if(item.action.includes(req.query.filter)){
                        returnResult.push(item)
                    }
                })
            }else{
                returnResult = action
            }

            let count =await ActionHistoryModel.find({}).countDocuments();
            let totalPages = Math.ceil(count / pageSize);
            return res.status(200).json({
                actions: returnResult  ,
                pageSize: pageSize  , 
                pageIndex: pageIndex,
                count : count< 99 ? 150 : count,
                totalPages: totalPages < 10 ? 10 : totalPages
            })

            // const count = await ActionHistoryModel.find({}).countDocuments();
            // return res.status(200).json({actions: returnResult,pageSize: pageSize, pageIndex: pageIndex, totalDoc: count, totalPage: Math.ceil(count/pageSize)})


            
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: error})
        }
    }
}

module.exports = new ActionHistroyController()