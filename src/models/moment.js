import mongoose from 'mongoose';

const momentSchema = mongoose.Schema({
  contents: [{ type: mongoose.Schema.ObjectId, ref: 'Content' }],
  caption: String,
  space: { type: mongoose.Schema.ObjectId, ref: 'Space' },
  // tags: [{ type: mongoose.Schema.ObjectId, ref: 'Tag' }],
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  disappearAt: Date, // もしくはnull
  createdAt: Date,
});

const Moment = mongoose.model('Moment', momentSchema);

export default Moment;
