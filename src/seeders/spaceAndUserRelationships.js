import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import User from '../models/user.js';
import Space from '../models/space.js';

export const seedSpaceAndUserRelationships = async () => {
  try {
    await SpaceAndUserRelationship.deleteMany({});
    console.log('🗑️ All space and user relationship documents deleted 🗑️');

    const users = await User.find();
    const spaces = await Space.find();

    // for each user, each space
    for (const user of users) {
      for (const space of spaces) {
        const relationship = new SpaceAndUserRelationship({
          user: user._id,
          space: space._id,
        });
        await relationship.save();
      }
    }
    console.log('🌱 Space and user relationship documents seeded successfully 🌱');
  } catch (error) {
    console.error('🔴 Error seeding space and user relationship documents 🔴', error);
  }
};
