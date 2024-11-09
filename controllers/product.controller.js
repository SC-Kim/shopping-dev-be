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
            isDeleted: false, status: "active"
        } : { isDeleted: false, status: "active" }
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
        return { isVerify: false, message: `${product.name}의 ${item.size} 재고가 부족합니다. ` }
    }

    return { isVerify: true }
}

productController.checkItemListStock = async (itemList) => {
    const insufficientStockItems = []

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


    // 재고 부족이 없는 경우에만 재고 업데이트 수행
    if (insufficientStockItems.length === 0) {
        // productId별로 아이템을 묶기 위해 Map을 사용합니다.
        const productMap = new Map();

        // 각 item을 productId를 키로 하여 Map에 저장
        itemList.forEach((item) => {
            if (!productMap.has(item.productId)) {
                productMap.set(item.productId, []);
            }
            productMap.get(item.productId).push(item);
        });

        // 각 productId에 대해 재고 업데이트 및 저장
        await Promise.all(
            Array.from(productMap.entries()).map(async ([productId, items]) => {
                const product = await Product.findById(productId);
                if (!product) throw new Error(`Product with ID ${productId} not found`);

                const newStock = { ...product.stock };

                // 각 size별로 재고를 차감합니다.
                items.forEach(item => {
                    if (newStock[item.size] !== undefined) {
                        newStock[item.size] -= item.qty;
                    }
                });

                // 업데이트된 재고를 제품에 반영하고 저장합니다.
                product.stock = newStock;
                await product.save();
            })
        );
    }

    return insufficientStockItems
}

module.exports = productController