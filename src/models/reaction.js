import mongoose, { mongo } from 'mongoose';

const reactionSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ['emoji', 'sticker'],
  },
  emoji: String,
  sticker: {
    type: mongoose.Schema.ObjectId,
    ref: 'Sticker',
  },
  caption: {
    type: String,
    default: '',
  },
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
});

const Reaction = mongoose.model('Reaction', reactionSchema);

export default Reaction;
