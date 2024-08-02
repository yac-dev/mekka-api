import mongoose from 'mongoose';

const contentSchema = mongoose.Schema({
  data: {
    type: String,
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
