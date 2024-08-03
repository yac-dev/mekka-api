import mongoose from 'mongoose';

// 基本、space idと、自分のuser id, 自分が最後にspaceにいた時間を使ってlogをそれぞれ取って来たいよな。
// spaceとcreatedAtでfilterしてきたい。
// 基本、postするたびにlogを作ればいいか。
const logSchema = mongoose.Schema({
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
  type: {
    type: String,
    enum: ['normal', 'moment'],
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
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

const Log = mongoose.model('Log', logSchema);
export default Log;
// そうか、tagで最後にupdagteされた日付と、自分のspaceに最後出入りした日付を比べるのか。。。
