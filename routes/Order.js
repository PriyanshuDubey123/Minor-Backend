const express = require('express');

const { fetchOrdersByUser, createOrder, deleteOrder, updateOrder, fetchAllOrders } = require('../controller/Order');


const router = express.Router();

router.post('/',createOrder).get('/user/:userId',fetchOrdersByUser).delete('/:id',deleteOrder).patch('/:id',updateOrder).get('/',fetchAllOrders);

exports.router = router;