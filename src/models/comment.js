import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
  content: String,
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  reply: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: Date,
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
