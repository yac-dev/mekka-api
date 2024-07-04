// どのpostに誰がどのreactionをしたかの関係のmodel。
// シンプルにこれのdocumentの数を調べればいいや。
import mongoose from 'mongoose';

// 基本はpostでのgetかuser idを使ってのpost request。探す時は、post idで探して、かつreactionがnullでない、かつuserもnullでなもんを返せばいい。
// 作るものによるが、どういう時の場合はclientに返すか、どういう場合にはclientに返したくないか、
// そこらへんをあらかじめ抑えてないといけない。
const postAndReactionAndUserRelationshipSchema = mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    index: true,
  },
  reaction: {
    type: mongoose.Schema.ObjectId,
    ref: 'Reaction',
    index: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

export const PostAndReactionAndUserRelationship = mongoose.model(
  'PostAndReactionAndUserRelationship',
  postAndReactionAndUserRelationshipSchema
);
