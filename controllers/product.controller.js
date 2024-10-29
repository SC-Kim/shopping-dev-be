const Product = require("../models/Product")

const PAGE_SIZE = 1
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

        const cond = name ? { name: { $regex: name, $options: 'i' } } : {}
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


module.exports = productController