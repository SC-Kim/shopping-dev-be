const Product = require("../models/Product")

const PAGE_SIZE = 3
const productController = {}

productController.createProduct = async (req, res) => {
    try {
        const { sku, name, size, image, category, description, price, stock, status } = req.body
        const product = new Product({
            sku,
            name,
            size,
            image,
            category,
            description,
            price,
            stock,
            status
        });

        await product.save()
        res.status(200).json({ status: "success", product })
    } catch (error) {
        res.status(400).json({ status: "fail", error: error.message })
    }
}

productController.getProducts = async (req, res) => {
    try {
        const { page, name } = req.query
        // if (name) {
        //     const product = await Product.fine({ name: { $regex: name, $option: "i" } });
        // } else {
        //     const products = await Product.find({});
        // }

        const cond = name ? {
            name: { $regex: name, $options: 'i' },
            isDeleted: false
        } : { isDeleted: false }
        let query = Product.find(cond)
        let response = { status: "success", };
        if (page) {
            query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
            // 총 몇개의 페이지가 있는지? 
            // 데이터가 총 몇개 있는지 체크해서 페이지 사이즈로 나눈다.
            const totalItemNum = await Product.countDocuments(cond);
            const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
            response.totalPageNum = totalPageNum;
        }

        const productList = await query.exec()
        response.data = productList
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ status: "fail", error: error.message })
    }
}

productController.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { sku, name, size, image, price, description, category, stock, status } = req.body

        const product = await Product.findByIdAndUpdate(
            { _id: productId },
            { sku, name, size, image, price, description, category, stock, status },
            { new: true }
        );
        if (!product) throw new Error("Item doesn't exist!!")
        res.status(200).json({ status: "success", data: product })
    } catch (error) {
        res.status(400).json({ status: "fail", error: error.message })
    }
}

productController.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findByIdAndUpdate(
            { _id: productId },
            { isDeleted: true }
        );

        if (!product) throw new Error("No item found")
        res.status(200).json({ status: "success" })

    } catch (error) {
        res.status(400).json({ status: "fail", error: error.message })
    }
}

productController.getProductById = async (req, res) => {
    try {

        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) throw new Error("No item found!!")
        res.status(200).json({ status: "success", data: product })
    } catch (error) {
        res.status(400).json({ status: "fail", error: error.message })
    }
}

productController.checkStock = async (item) => {
    // 내가 사려는 아이템 재고 정보 들고 오기 
    const product = await Product.findById(item.productId)

    // 내가 사려는 아이템 qty와 재고 비교 
    if (product.stock[item.size] < item.qty) {
        // 재고가 불충분하면 불충분 메시지와 함께 데이터 반환 
        return { isVerify: false, message: `${product.name}의 ${item.size} 재고가 부족합니다.` }
    }

    // 충분하다면 => 재고 - qty 처리하고 재고 업데이트  
    const newStock = { ...product.stock }
    newStock[item.size] = newStock[item.size] - item.qty
    product.stock = newStock
    await product.save()

    return { isVerify: true }


}

productController.checkItemListStock = async (itemList) => {
    const insufficientStockItems = []
    //재고 확인

    await Promise.all(
        itemList.map(async (item) => {
            const stockCheck = await productController.checkStock(item)
            
            // 재고가 부족한 경우 처리
            if (!stockCheck.isVerify) {
                insufficientStockItems.push({ item, message: stockCheck.message })
            }
            return stockCheck;
        })
    )

    return insufficientStockItems
}

module.exports = productController