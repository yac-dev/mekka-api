import Log from '../models/log.js';
import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import Tag from '../models/tag.js';

export const seedLogs = async () => {
  try {
    await Log.deleteMany();
    console.log('🗑️ All log documents deleted 🗑️');

    const spaceAndUserRelationships = await SpaceAndUserRelationship.find().populate({
      path: 'space',
      populate: [
        {
          path: 'createdBy',
          select: '_id name avatar',
        },
      ],
    });
    const tags = await Tag.find({});
    for (const relationship of spaceAndUserRelationships) {
      const spaceTags = tags.filter((tag) => tag.space.toString() === relationship.space._id.toString());
      const { space, lastCheckedIn, user } = relationship;
      for (const tag of spaceTags) {
        // 30% chance to create a log after lastCheckedIn
        if (Math.random() < 0.5) {
          const newLogDate = new Date(lastCheckedIn.getTime() + 3 * 24 * 60 * 60 * 1000);
          await Log.create({
            type: 'normal',
            space: space._id,
            tag: tag._id,
            createdBy: user._id,
            createdAt: newLogDate,
          });
        }
      }
    }
    console.log('🌱 All logs seeded successfully 🌱');
  } catch (error) {
    console.error('🔴 Error seeding logs 🔴', error);
  }
};
