const IpModel = require('../../database/entities/Ip')

class IpController {
    async initIpController(req,res){
        try {
            const arrayOfIp = []
            
            for (let i = 0; i <= 256; i++){
                arrayOfIp.push(`103.37.60.${i}`)
            }

            for(let i = 0; i <= 255; i++){
                arrayOfIp.push(`103.37.61.${i}`)
            }

            const result = await Promise.all(arrayOfIp.map(async item => await IpModel.create({ip: item})))

            return res.status(200).json({result: result})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: 'Error'})
        }
    }

    async getPaging(req, res){
        try {
            const pageIndex = req.query.pageIndex || null
            const pageSize = req.query.pageSize || null
            const status = req.query.status || null

             const query = {
                
             }

            if(status){
                query.status = status
            }
            const result = await IpModel.find(query).skip((pageSize * pageIndex) - pageSize).limit(pageSize)
            let count = await IpModel.find(query).countDocuments();
            let totalPages = Math.ceil(count / pageSize);
            return res.status(200).json({message: 'Success', ip: result, pageSize: pageSize, pageIndex: pageIndex, totalPages: totalPages, count: count})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: "Failed"})
        }
    }

    async createIp(req, res){
        try {
            const ip = req.body.ip || null

            if(!ip){
                return res.status(400).json({message: 'Ip can not empty'})
            }
            const newIp = IpModel.create({
                ip: req.body.ip
            })
            return res.status(200).json({message: 'Create success'})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: 'Failed'})
        }
    }

    async updateIp(req, res){
        try {
            const id = req.params.id || null
            const ip = req.body.id

            if(!id){
                return res.status(400).json({message: "Id can not be empty"})
            }

            if(!ip){
                return res.status(400).json({message: "Ip can not be empty"})
            }
            const result = await IpModel.findByIdAndUpdate(id, {ip: ip})

            return res.status(200).json({message: "Success", ip: result})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: 'Failed'})
        }
    }

    async getById(req, res){
        try {
            const result = await IpModel.findById(req.params.id)
            return res.status(200).json({message: "Success", ip: result})
        } catch (error) {
            console.log(error)
            return res.status(500).json({message: 'Fail'})
        }
    }
}

module.exports = new IpController()