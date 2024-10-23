const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const productSchema = Schema({
    sku: {type:String, required:true, unique:true}, // Stock Keeping Unit 제품 식별자 
    name: {type:String, required:true},
    image: {type:String, required:true},
    category: {type:Array, required:true},      // 여러 카테고리에 속할 수 있고, 동적으로 추가 변경 가능 (배열)
    description: {type:String, required:true},
    price: {type:Number, required:true},
    stock: {type:Object, required:true},
    status: {type:String, default:"active"},
    isDeleted:{type:Boolean, default:false}
}, {timestamps:true})

productSchema.methods.toJSON = function () {
    const obj = this._doc
    delete obj.__v
    delete obj.updateAT
    delete obj.createAt
    return obj
}

const Product = mongoose.model("Product", productSchema)
module.exports = Product;