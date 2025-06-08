import mongoose from 'mongoose';

const replySchema = mongoose.Schema({
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
