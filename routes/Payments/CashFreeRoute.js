const express = require("express");
const { CashFreePayment, getOrderStatus } = require("../../controller/Payments/CashFreeController");

const router = express.Router();


router.get("/payment",CashFreePayment);
router.get("/order/status",getOrderStatus);

module.exports = router;