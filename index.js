const express = require("express");

const server = express();
const mongoose = require("mongoose");
const cors = require("cors");

const authRouters = require("./routes/Auth");

const courseRouters = require("./routes/Course");
const categoriesRouters = require("./routes/Category");
const languageRouters = require("./routes/Language");
const cartRouters = require("./routes/Cart");
const orderRouters = require("./routes/Order");
const usersRouters = require("./routes/User");

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
