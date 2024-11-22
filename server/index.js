
const express = require("express");
const fs = require('fs');
const path = require('path');

const mongoose = require("mongoose");
const cors = require("cors");
const request = require('request');
const { Server } = require("socket.io");
const socketIo = require("socket.io");
const http = require("http");


const server = express();


const app = http.createServer(server);

const io = new Server(app, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {};

io.on("connection", (socket) => {
  // socket.emit("register", "Welcome to the app");

  socket.on("register", async(userId) => {
    // console.log("helloinfluencer")
    userSocketMap[userId] = socket.id;

    const chats = await Chat.find({
      "participants.id": userId,
    });
    
    if (chats && chats.length > 0) {
      for (const chat of chats) {
        const participant = chat.participants.find(
          (p) => p?.id?.toString() === userId?.toString()
        );
    
        if (participant && !participant.onlineStatus) {
          participant.onlineStatus = true; // Update the field in memory
        }
    
        await chat.save(); // Save each chat document after updating
      }
    socket.broadcast.emit("receiveOnlineStatus", { userId, status: true });
      console.log("Updated online status for relevant chats.");
    } else {
      console.log("No chats found for the given user.");
    }
    

  });

  socket.on("disconnect", async() => {
    const userId = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );
    if (userId && userId!=="null") {
      delete userSocketMap[userId];
      const chats = await Chat.find({
        "participants.id": userId
      });
      
      if (chats && chats.length > 0) {
        for (const chat of chats) {
          const participant = chat.participants.find(
            (p) => p?.id?.toString() === userId?.toString()
          );
      
          if (participant && participant.onlineStatus) {
            participant.onlineStatus = false; // Update the field in memory
          }
      
          await chat.save(); // Save each chat document after updating
        }
    socket.broadcast.emit("receiveOnlineStatus", { userId, status: false });
        console.log("Updated online status for relevant chats.");
      } else {
        console.log("No chats found for the given user.");
      }
    }
  });
});

server.use((req, res, next) => {
  req.userSocketMap = userSocketMap;
  req.io = io;
  next();
});

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
const NotificationRoute = require("./routes/Notification");
const FriendsRoute = require("./routes/Friends");
const ChatsRoute = require("./routes/Chat");
const LiveClassRoute = require("./routes/LiveClass");


const { User } = require("./model/User");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const Chat = require("./model/Chat");



  
server.use(express.static('build'))

server.use(morgan("dev"))
  

server.use(express.json());
const corsOptions = {
  origin: [
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  exposedHeaders: ["X-Total-Count"],
};

server.use(cors(corsOptions));

server.use(cookieParser());

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
server.use("/api/notifications",NotificationRoute)
server.use("/api/friends",FriendsRoute)
server.use("/api/chats",ChatsRoute)
server.use("/api/livestream",LiveClassRoute)




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
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("database connected");
}



app.listen(8080, () => {
  console.log("Server is started on port 8080");
});
