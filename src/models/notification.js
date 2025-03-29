import mongoose from 'mongoose';

// どのspaceで誰がなんの通知objectを作ったか？
// どのpostにcommentしたか、
// どのpostにreactionをしたか
const notificationSchema = mongoose.Schema({
  to: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['comment', 'reaction', 'follow'],
  },
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  comment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
  },
  follower: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reaction: {
    type: mongoose.Schema.ObjectId,
    ref: 'Reaction',
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
