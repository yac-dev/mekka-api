import mongoose from 'mongoose';

const spaceAndUserRelationshipSchema = mongoose.Schema({
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    index: true,
  },
  lastCheckedIn: Date,
  createdAt: Date,
});

const SpaceAndUserRelationship = mongoose.model('SpaceAndUserRelationship', spaceAndUserRelationshipSchema);

export default SpaceAndUserRelationship;
