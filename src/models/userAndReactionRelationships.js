import mongoose from 'mongoose';

const userAndReactionRelationshipSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reaction: {
    type: mongoose.Schema.ObjectId,
    ref: 'Reaction',
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  createdAt: Date,
});

const UserAndReactionRelationship = mongoose.model('UserAndReactionRelationship', userAndReactionRelationshipSchema);

export default UserAndReactionRelationship;
