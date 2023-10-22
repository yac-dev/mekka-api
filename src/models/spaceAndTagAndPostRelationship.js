// postをtagで検索する。そのためにも、postでtagsを持っておくのはだめ。
import mongoose from 'mongoose';

const spaceAndTagAndPostRelationshipSchema = mongoose.Schema({
  space: { type: mongoose.Schema.ObjectId, ref: 'Space' },
  post: { type: mongoose.Schema.ObjectId, ref: 'Post' },
  tag: { type: mongoose.Schema.ObjectId, ref: 'Tag' },
});

const SpaceAndTagAndPostRelationship = mongoose.model(
  'SpaceAndTagAndPostRelationship',
  spaceAndTagAndPostRelationshipSchema
);

export default SpaceAndTagAndPostRelationship;
