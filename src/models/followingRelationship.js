import mongoose from 'mongoose';

const followingRelationshipSchema = mongoose.Schema({
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
  follower: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  followee: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const FollowingRelationship = mongoose.model('FollowingRelationship', followingRelationshipSchema);
export default FollowingRelationship;
// そうか、tagで最後にupdagteされた日付と、自分のspaceに最後出入りした日付を比べるのか。。。
