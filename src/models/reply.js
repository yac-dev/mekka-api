import mongoose from 'mongoose';

// どのcoomentに付属したreplyであるか、そのcommentIdは必要であるな。
const replySchema = mongoose.Schema({
  to: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  comment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
    index: true,
  },
  content: String,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: Date,
});

const Reply = mongoose.model('Reply', replySchema);

export default Reply;
