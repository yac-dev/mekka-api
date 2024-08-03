import mongoose from 'mongoose';

const contentSchema = mongoose.Schema({
  data: {
    type: String,
  },
  thumbnail: {
    type: String,
    // videoの場合にあり、
  },
  type: {
    type: String,
    enum: ['photo', 'video'], // launchedは、portでのchat用ね。
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  duration: {
    type: Number,
    // videoの場合にあり、
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const Content = mongoose.model('Content', contentSchema);

export default Content;
