import mongoose from 'mongoose';

const momentSchema = mongoose.Schema({
  contents: [{ type: mongoose.Schema.ObjectId, ref: 'Content' }],
  caption: String,
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
});

const Moment = mongoose.model('Moment', momentSchema);

export default Moment;
