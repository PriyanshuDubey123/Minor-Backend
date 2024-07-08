const express = require("express");
const fs = require('fs');
const path = require('path');

const server = express();
const mongoose = require("mongoose");
const cors = require("cors");
const request = require('request');

const authRouters = require("./routes/Auth");

const courseRouters = require("./routes/Course");
const categoriesRouters = require("./routes/Category");
const languageRouters = require("./routes/Language");
const cartRouters = require("./routes/Cart");
const orderRouters = require("./routes/Order");
const usersRouters = require("./routes/User");
const LiveCoursesRoutes = require('./routes/LiveCourses');
const CreatorRoutes = require('./routes/CreatorRoutes');
const CashFreeRoute = require('./routes/Payments/CashFreeRoute');  

const { User } = require("./model/User");



server.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
  );
  
  
  server.use(express.static('build'))
  

server.use(express.json());

server.use("/auth", authRouters.router);
server.use("/users", usersRouters.router);
server.use("/courses", courseRouters.router);
server.use("/categories", categoriesRouters.router);
server.use("/languages", languageRouters.router);
server.use("/cart", cartRouters.router);
server.use("/orders", orderRouters.router);
server.use("/api/courses", LiveCoursesRoutes);
server.use("/api/creator", CreatorRoutes.router);
server.use("/api/cashfree", CashFreeRoute);




// Videos

server.get('/video', (req, res) => {
  const videoUrl = decodeURIComponent(req.query.videoUrl);
  const range = req.headers.range;

  if (!range) {
      res.status(400).send("Requires Range header");
      return;
  }

  request(videoUrl, { encoding: null, headers: { range } })
      .on('response', (response) => {
          if (response.statusCode === 200 || response.statusCode === 206) {
              res.writeHead(response.statusCode, {
                  'Content-Range': response.headers['content-range'],
                  'Accept-Ranges': response.headers['accept-ranges'],
                  'Content-Length': response.headers['content-length'],
                  'Content-Type': response.headers['content-type']
              });
              response.pipe(res);
          } else {
              res.sendStatus(response.statusCode);
          }
      })
      .on('error', (err) => {
          res.sendStatus(500);
          console.error('Error fetching video:', err);
      });
});



// Payments


// This is your test secret API key.
const stripe = require("stripe")('sk_test_51OHvRgSIiPYAQKAunGfnlLXfuums3GhiqwbYM9ULCiyfScNA9FKa8vLgGRrNSTZdihjbj4tXbN66xXmexRJmC1Wf00PhIfYxeJ');



server.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
const {totalAmount} = req.body;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount*100,
    currency: "inr",
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});




main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/studymate");
  console.log("database connected");
}

server.listen(8080, () => {
  console.log("Server is started on port 8080");
});
