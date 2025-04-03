import mongoose from 'mongoose';
// const mongoose = require('mongoose');
// あれだ。error handlingだな。やるべきは。。。あとは、authorization
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('👍 Database connection succeeded 👍');
  })
  .catch((error) => {
    console.log('💩 Database connection failed... 💩');
    console.log(error);
  });
