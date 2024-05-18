import mongoose from 'mongoose';

const spaceUpdateLogSchema = mongoose.Schema({
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  tag: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tag',
  }, // これでtagの数なんかもあのdsでまとめてユーザーに返すことになる。
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: Date,
});

// 通知システムの順序としてはこんな感じ。
// まず、userがappを閉じたらspaceAndUserRelのlastCheckedInを更新する。そのappを閉じた日時に。
// そして、他のuserがなにかをpostするたびに, 新しいこのspace logを作る感じ。
// userが何かpostしたら、新しいlog instanceを作る感じか。

// 実際にuserがappを開いたら、まずspaceAndUserRelsを取ってくるんだが、、、、
// 同時にそれらのspaceのidを使って、このspaceUpdateLogのdocumentを取ってくる、lastCheckedInよりもupdatedAtの方が新しいものを。
// それをtable型でまとめてclient側へ返す感じか。

// tagをspaceIdを使ってfetchいてくわけだが、、、
// その時もfetchしてきたtagのidとlastCheckedInを使って、tagUpdateのinstanceを検索してくる。spaceのlastCheckedInよりも新しいtagUpdateの数を。。。

const SpaceUpdateLog = mongoose.model('SpaceUpdateLog', spaceUpdateLogSchema);
export default SpaceUpdateLog;
