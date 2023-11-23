import http from 'http';
import app from './app';
import mongoose from 'mongoose';

// const server = http.createServer(app);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected👍`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(3500, () => {
    console.log('listening for requests');
  });
});

// server.listen(3500, () => {
//   console.log('listening on port 3500');
// });
