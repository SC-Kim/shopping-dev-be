const User = require("../models/User")
const bcrypt = require("bcryptjs")

const userController = {}

userController.createUser = async(req, res) => {
    try{
        // 프론트엔드가 있다고 상상하고 코딩해본다.
        // 회원가입 할 때 어떤 정보 보낼까 (이메일, 패스워드, 이름)
        
        let {email, password, name, level} = req.body
        const user = await User.findOne({email})
        if(user){
            throw new Error("이미 가입된 유저 입니다.")
        }

        const salt = await bcrypt.genSaltSync(10)
        password = await bcrypt.hash(password, salt)
        const newUser = new User({email, password, name, level:level?level:'customer'})
        await newUser.save()
        return res.status(200).json({status: "success"})

    } catch(error){
        res.status(400).json({status: "fail", error:error.message})
    }
}

module.exports=userController