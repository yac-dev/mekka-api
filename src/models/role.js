import mongoose from 'mongoose';

const roleSchema = mongoose.Schema({
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
    required: true,
  },
  icon: {
    type: String,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: Date,
  updatedAt: Date,
});

// spaceAndUserRelでrole: roleIdを割り振っておくのがよさそう。

const Role = mongoose.model('Role', roleSchema);

export default Role;
