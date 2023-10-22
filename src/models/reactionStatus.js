import mongoose from 'mongoose';

// この場合だと、postした時点で、このstatusを作らないといけないね。
const reactionStatusSchema = mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  reaction: {
    type: mongoose.Schema.ObjectId,
    ref: 'Reaction',
  },
  count: Number,
});

const ReactionStatus = mongoose.model('ReactionStatus', reactionStatusSchema);

export default ReactionStatus;
