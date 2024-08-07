import mongoose from 'mongoose';

// どのspaceで誰がなんの通知objectを作ったか？
// どのpostにcommentしたか、
// どのpostにreactionをしたか
const notificationSchema = mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
  comment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
  },
  reaction: {
    type: mongoose.Schema.ObjectId,
    ref: 'Reaction',
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
