// postをtagで検索する。そのためにも、postでtagsを持っておくのはだめ。
import mongoose from 'mongoose';

const postAndTagRelationshipSchema = mongoose.Schema({
  post: { type: mongoose.Schema.ObjectId, ref: 'Post' },
  tag: { type: mongoose.Schema.ObjectId, ref: 'Tag', index: true },
});

const PostAndTagRelationship = mongoose.model('PostAndTagRelationship', postAndTagRelationshipSchema);

export default PostAndTagRelationship;
