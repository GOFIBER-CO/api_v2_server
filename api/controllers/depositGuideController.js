const depositeModel = require('../../database/entities/DepositGuide')

class DepositGuideController {
    async getDepositGuide(req, res){
        try {
            const result = await depositeModel.find({})
            if(result){
                return res.status(200).json(result[0])
            }else{
                return res.status(404).json({message: 'Không tìm thấy kết quả'})
            }
        } catch (error) {
            console.log(error)
            return res.status(400).json({message: error})
        }
    }

    async updateDepositGuide(req, res){
        if(!req.body.content)
            return res.status(403).json({message: 'Thiếu dữ liệu đầu vào'})
        if(!req.params.id)
            return res.status(404).json({message: 'Không tìm thấy hướng dẫn nạp tiền'})
        try {
            const result = await depositeModel.findByIdAndUpdate(req.params.id, {content: req.body.content})
            return res.status(200).json({message: 'Cập nhật thành công'})
        } catch (error) {
            console.log(error)
            return res.status(400).json({message: error})
        }
    }
}

module.exports = new DepositGuideController()