const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const userSchema = Schema({
    email: {type:String, required:true, unique:true},
    passsword: {type:String, required:true},
    name: {type:String, required:true},
    level: {type:String, default:"customer"}    // 2types: customer, admin 
}, {timestamps:true})
userSchema.methods.toJSON = function () {
    const obj = this._doc
    delete obj.password
    delete obj.__v
    delete obj.updateAT
    delete obj.createAt
    return obj
}

const User = mongoose.model("User", userSchema)
module.exports = User;
