import mongoose from 'mongoose';

const tagUpdateLogSchema = mongoose.Schema({
  tag: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tag',
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  updatedAt: Date,
});

// const SpaceLog = mongoose.model('SpaceLog', spaceLogSchema);
// export default SpaceLog;
