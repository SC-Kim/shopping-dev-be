const express = require('express')
const authController = require('../controllers/auth.controller')
const orderController = require("../controllers/order.controller")
const router = express.Router()

router.post("/", authController.authenticate, orderController.createOrder)
router.get("/me", authController.authenticate, orderController.getOrder);

router.get("/", authController.authenticate, orderController.getOrderList);
router.put(
  "/:id",
  authController.authenticate,
  authController.checkAdminPermission,
  orderController.updateOrder
);

router.get("/recent-address", authController.authenticate, orderController.fetchRecentAddress);
router.get("/previous-addresses", authController.authenticate, orderController.fetchPreviousAddresses);

module.exports = router