import mongoose from 'mongoose';

const tagSchema = mongoose.Schema({
  icon: {
    type: mongoose.Schema.ObjectId,
    ref: 'Icon',
  }, // -> {_id: string, url: string, name: string}
  name: String,
  color: String,
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  type: {
    type: [String],
    // enum: [['photo'], ['video'], ['photo', 'video']],
    default: ['photo', 'video'],
  },
  updatedAt: Date,
});

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
