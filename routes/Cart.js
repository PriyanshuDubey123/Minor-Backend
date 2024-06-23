const express = require('express');

const { addtoCart, fetchCartByUser, deleteFromCart, updateCart } = require('../controller/Cart');

const router = express.Router();

router.post('/',addtoCart).get('/',fetchCartByUser).delete('/:id',deleteFromCart).patch('/:id',updateCart);

exports.router = router;