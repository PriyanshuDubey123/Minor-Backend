

const crypto = require('crypto');

const { Cashfree } = require('cashfree-pg');
const { User } = require('../../model/User');
const { default: axios } = require('axios');
const UserTransaction = require('../../model/UserTransaction');
const LiveCourses = require('../../model/LiveCourses');
const Creator = require('../../model/CreatorModal');
const individualCreatorAnalytics = require('../../model/IndividualCreatorAnalytics');

Cashfree.XClientId = 'TEST10184617998ae7424aa2bd40c27271648101';
Cashfree.XClientSecret = 'cfsk_ma_test_513eb0caec00e8792b854f01f396db37_2ada4cce';
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;


function generateOrderId() {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const OrderId = crypto.createHash('sha256').update(uniqueId).digest('hex');
    return OrderId.substr(0, 12);
}



exports.CashFreePayment = async (req, res) => {
    try {
        console.log(req.query.userId);

        const userData = await User.findById(req.query.userId);

        console.log(userData);


        let request = {
            "order_amount": req.query.amount,
            "order_currency": "INR",
            "order_id": generateOrderId(),
            "customer_details": {
                "customer_id": userData.username.replace(' ','1'),
                "customer_phone": "1111111111",
                "customer_name": userData.username,
                "customer_email": userData.email
            },
            "order_meta": {
                "return_url": 'http://localhost:3000/payment/success/page?order_id={order_id}'

            },
            "order_tags": {
                "courseId": req.query.courseId,
                "userId": req.query.userId,
                "creatorId": req.query.creatorId
            },
        }

        Cashfree.PGCreateOrder("2023-08-01", request).then(response => {
            console.log(response.data);
            res.json(response.data);

        }).catch(error => {
            console.error(error.response.data.message);
        })


    } catch (error) {
        console.log(error);
    }

};


exports.getOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.query;

        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);

        if (response && response.data && response.data.length !== 0) { // Check if response and response.data are not undefined
            // console.log(response.data);

            const orderData = await axios.get(`https://sandbox.cashfree.com/pg/orders/${orderId}`, {
                headers: {
                    accept: 'application/json',
                    'x-client-id': 'TEST10184617998ae7424aa2bd40c27271648101',
                    'x-client-secret': 'cfsk_ma_test_513eb0caec00e8792b854f01f396db37_2ada4cce',
                    'x-api-version': '2023-08-01'
                }
            }).catch(error => {
                console.error("Error fetching order data:", error);
                throw error; // Rethrow the error to be caught by the outer try-catch block
            });

            if (!orderData) {
                throw new Error("No order data received");
            }

            if (orderData && orderData.data) {
                const email = orderData.data.customer_details.customer_email;
                const name = orderData.data.customer_details.customer_name;
                const dateTime = response.data[0].payment_time;
                const paymentMethod = response.data[0].payment_group;
                const amount = response.data[0].payment_amount;
                const item = 'Course Purchase';
                const currency = response.data[0].payment_currency;
                const tax = 0;

                console.log(orderData.data);


                const transaction = await UserTransaction.findOne({ order_id: orderId });
                console.log(transaction)
                if (!transaction) {

                    const userId = orderData.data.order_tags.userId;
                    const courseId = orderData.data.order_tags.courseId;
                    const creatorId = orderData.data.order_tags.creatorId;

                    const userTransaction = new UserTransaction({
                        userId: userId,
                        courseId:courseId,
                        order_id: orderId,
                        amount: amount,
                        currency: "INR"
                    });

                    const transactionId = userTransaction._id;

                    await userTransaction.save();


                    let creatorAnalytics = await individualCreatorAnalytics.findOne({ creatorId: creatorId });
                    console.log(creatorAnalytics);
                    
                    const currentDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
                    
                    if (creatorAnalytics) {
                        // Document exists, update it
                        creatorAnalytics.totalSales += 1;
                        creatorAnalytics.totalRevenue += amount;
                    
                        creatorAnalytics.transactions.push({
                            userId: userId,
                            order_id: orderId,
                            amount: amount,
                            currency: "INR"
                        });
                    
                        // Check if there's an entry for the current date in dateWiseAnalytics
                        const dateEntry = creatorAnalytics.dateWiseAnalytics.find(entry => 
                            new Date(entry.date).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }) === currentDate
                        );
                    
                        if (dateEntry) {
                            // Entry exists, increment totalSales and totalRevenue
                            dateEntry.totalSales += 1;
                            dateEntry.totalRevenue += amount;
                        } else {
                            // Entry does not exist, add a new entry
                            creatorAnalytics.dateWiseAnalytics.push({
                                date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
                                totalSales: 1,
                                totalRevenue: amount
                            });
                        }
                    
                        await creatorAnalytics.save();
                    } else {
                        // Document does not exist, create a new one
                        creatorAnalytics = new individualCreatorAnalytics({
                            creatorId: creatorId,
                            totalSales: 1,
                            totalRevenue: amount,
                            transactions: [{
                                userId: userId,
                                order_id: orderId,
                                amount: amount,
                                currency: "INR"
                            }],
                            dateWiseAnalytics: [{
                                date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
                                totalSales: 1,
                                totalRevenue: amount
                            }]
                        });
                    
                        await creatorAnalytics.save();
                    }
                    
                    // Find the course by ID
                    const course = await LiveCourses.findById(courseId);

                    // Find the user by ID
                    const user = await User.findById(userId);

                    // Add user to the course's enrolledStudents array
                    course.enrolledStudents.push(userId);

                    // Add course to the user's purchasedCourses array
                    user.purchasedCourses.push(courseId);

                    // Save the updated course and user
                    await course.save();
                    await user.save();


                }

                return res.json({
                    email,
                    dateTime,
                    paymentMethod,
                    amount,
                    item,
                    name,
                    currency,
                    tax
                }); // Return response and exit the function
            } else {
                return res.status(200).json({ Unpaid: "Payment is not placed yet" }); // Return response and exit the function
            }
        } else {
            return res.status(200).json({ Unpaid: "Payment is not placed yet" }); // Return response and exit the function
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" }); // Return response and exit the function
    }
};


