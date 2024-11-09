const cartController = {}
const Cart = require("../models/Cart")

cartController.addItemToCart = async (req, res) => {
    try {
        const { userId } = req; // 미들웨어에서 받아온다. (authController.authenticate)
        const { productId, size, qty } = req.body


        // 유저를 가지고 카트 찾기
        let cart = await Cart.findOne({ userId })

        // 카트가 없는 신규 가입자 라면, 새 카트 만들어 주기 
        if (!cart) {
            cart = new Cart({ userId, items: [] })
            await cart.save()
        }
        // 이미 카트에 들어가 있는 아이템 인가? (productId, size)
        const existItem = cart.items.find(
            (item) => item.productId.equals(productId) && item.size === size)  //mongoose objectid 타임은 equals 함수를 활용해서 비교한다. 
        if (existItem) {
            // 에러 응답을 바로 반환
            return res.status(400).json({ status: "fail", error: "아이템이 이미 카트에 담겨 있습니다." });
        }

        // 카트에 아이템 추가
        // cart.items = [...cart.items, {productId, size, qty}]
        cart.items.push({ productId, size, qty });
        await cart.save()

        res.status(200).json({ status: "success", data: cart, cartItemQty: cart.items.length })

    } catch (error) {
        return res.status(400).json({ status: "fail", error: error.message })
    }
}

cartController.getCart = async (req, res) => {
    try {
        const { userId } = req

        let cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            select: undefined             //'name price image' // 필요한 필드만 선택
        });
        
        if (!cart) {
            cart = { items: [], totalPrice: 0 };
        }

        res.status(200).json({ status: "success", data: cart.items })
    } catch (error) {
        return res.status(400).json({ status: "fail", error: error.message })
    }
}

cartController.deleteCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;
        const cart = await Cart.findOne({ userId });
        cart.items = cart.items.filter((item) => !item._id.equals(id));

        await cart.save();
        res.status(200).json({ status: 200, cartItemQty: cart.items.length });
    } catch (error) {
        return res.status(400).json({ status: "fail", error: error.message })
    }
}

cartController.editCartItem = async (req, res) => {
    try {
        const { userId } = req;
        const { id } = req.params;

        const { qty } = req.body;
        const cart = await Cart.findOne({ userId }).populate({
            path: "items",
            populate: {
                path: "productId",
                model: "Product",
            },
        })
        if (!cart) throw new Error("There is no cart for this user");
        const index = cart.items.findIndex((item) => item._id.equals(id));
        if (index === -1) throw new Error("Cannot find item")
        cart.items[index].qty = qty;
        await cart.save();
        res.status(200).json({status:"success", data:cart.items });

    } catch (error) {
        return res.status(400).json({status:"fail", error:error.message})

    }
}

cartController.getCartQty = async (req, res) =>{
    try{
        const { userId } = req;
        const cart = await Cart.findOne({ userId: userId })
        if (!cart) throw new Error("There is no cart!");
        res.status(200).json({status:200, qty: cart.items.length})

    }catch(error){
        return res.status(400).json({status:"fail", errror:error.message})
    }
}

module.exports = cartController