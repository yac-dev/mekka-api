import mongoose from 'mongoose';

const postSchema = mongoose.Schema({
  contents: [{ type: mongoose.Schema.ObjectId, ref: 'Content' }],
  type: {
    type: String,
    enum: ['normal', 'moment'],
  },
  caption: String,
  locationTag: { type: mongoose.Schema.ObjectId, ref: 'LocationTag' }, // これは一つのみ。
  space: { type: mongoose.Schema.ObjectId, ref: 'Space' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  createdAt: Date,
  totalComments: {
    type: Number,
    default: 0,
  },
  totalReactions: {
    type: Number,
    default: 0,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
  },
  disappearAt: Date,
  // typeormで、mongodb用とかだといいよなー。。
  // disappearAt: Date, // もしくはnull

  // tags: [{ type: mongoose.Schema.ObjectId, ref: 'Tag' }],
});

const Post = mongoose.model('Post', postSchema);

export default Post;
