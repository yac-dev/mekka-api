import mongoose from 'mongoose';

const tagUpdateLogSchema = mongoose.Schema({
  tag: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tag',
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  updatedAt: Date,
});

const TagUpdateLog = mongoose.model('TagUpdateLog', tagUpdateLogSchema);
export default TagUpdateLog;
// そうか、tagで最後にupdagteされた日付と、自分のspaceに最後出入りした日付を比べるのか。。。
