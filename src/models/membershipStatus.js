import { Schema, model } from 'mongoose';

const membershipStatusSchema = Schema({
  status: {
    type: String,
    enum: ['normal', 'bronze', 'silver', 'gold'],
    default: 'normal',
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

export const MembershipStatus = model('MembershipStatus', membershipStatusSchema);
