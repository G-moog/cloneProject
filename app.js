require("dotenv").config();
const express = require("express");
const connect = require("./models");
const cors = require("cors");
const app = express();


const port = 3000;
const booking_router = require('./routes/booking');
const comments_router = require('./routes/comments');
const users_router = require('./routes/users');


const requestMiddlware = (req, res, next) => {
  console.log("Request URL:", req.originalUrl, "-", new Date());
  next();
};

// jwt.verify(tokenValue, process.env.JWT_SECRET);

app.use(cors());
app.use(requestMiddlware);
app.use('/api', [booking_router, comments_router, users_router]);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`http://localhost:${port}에 접속되었습니다.`);
});