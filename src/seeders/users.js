import User from '../models/user.js';
import { MembershipStatus } from '../models/membershipStatus.js';
import bcrypt from 'bcrypt';

const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'testuser12',
    avatar: null,
    pushToken: '',
    lastNotificationOpened: null,
  },
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'testuser12',
    avatar: null,
    pushToken: '',
    lastNotificationOpened: null,
  },
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    password: 'testuser12',
    avatar: null,
    pushToken: '',
    lastNotificationOpened: null,
  },
];

export const seedUsers = async () => {
  try {
    await User.deleteMany({});
    await MembershipStatus.deleteMany({});
    console.log('🗑️ All user documents deleted 🗑️');

    for (const userData of users) {
      const user = new User(userData);

      const membershipStatus = new MembershipStatus({
        status: 'normal',
      });
      await membershipStatus.save();
      user.membershipStatus = membershipStatus._id;
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();
    }
    console.log('🌱 User documents seeded successfully 🌱');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

export const clearUsers = async () => {
  await User.deleteMany({});
  console.log('🗑️ All user documents deleted 🗑️');
};
