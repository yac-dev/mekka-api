import mongoose from 'mongoose';

const postSchema = mongoose.Schema({
  contents: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Content',
    },
  ],
  type: {
    type: String,
    enum: ['normal', 'moment'],
  },
  caption: {
    type: String,
  },
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
  },
  disappearAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const Post = mongoose.model('Post', postSchema);

export default Post;
