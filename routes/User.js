const express = require('express');
const { fetchUserById, updateUser, getPurchasedCourses, fetchTransactions } = require('../controller/User');

const router = express.Router();

router.get('/:id',fetchUserById)
.patch('/:id',updateUser)
.get('/purchased-courses/:id',getPurchasedCourses)
.get('/transactions/:id',fetchTransactions);

exports.router = router;