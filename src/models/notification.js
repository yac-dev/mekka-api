import mongoose from 'mongoose';

// どのspaceで誰がなんの通知objectを作ったか？
const notificationSchema = mongoose.Schema({
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
  comment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  tag: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tag',
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

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
