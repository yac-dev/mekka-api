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
    enum: ['comment', 'reaction', 'tag'],
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  comment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
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
