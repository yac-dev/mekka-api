import Reaction from '../models/reaction.js';
import mongoose from 'mongoose';
import Space from '../models/space.js';

const reactions = [
  {
    type: 'emoji',
    sticker: null,
    emoji: '😁',
    caption: 'Nice bro',
  },
  {
    type: 'emoji',
    sticker: null,
    emoji: '😎',
    caption: 'Braaavo',
  },
  {
    type: 'sticker',
    sticker: new mongoose.Types.ObjectId('64d0e091158cac146b8ef81a'),
    emoji: null,
    caption: 'Lmao',
  },
  {
    type: 'sticker',
    sticker: new mongoose.Types.ObjectId('64d0e014158cac146b8ef816'),
    emoji: null,
    caption: 'WTF?!',
  },
  {
    type: 'emoji',
    sticker: null,
    emoji: '👎',
    caption: 'Boooooo',
  },
  {
    type: 'sticker',
    sticker: new mongoose.Types.ObjectId('64d0e076158cac146b8ef819'),
    emoji: null,
    caption: 'Curious',
  },
];

export const seedReactions = async () => {
  try {
    // spaceごとにreactionを作らなあかん。
    await Reaction.deleteMany({});
    console.log('🗑️ All reactions deleted 🗑️');
    const spaces = await Space.find();
    for (const space of spaces) {
      const reactionDocs = [];
      for (const reaction of reactions) {
        const newReaction = new Reaction({
          ...reaction,
          space: space._id,
        });
        reactionDocs.push(newReaction);
      }
      const newReactions = await Reaction.insertMany(reactionDocs);
      space.reactions = newReactions.map((reaction) => reaction._id);
      await space.save();
    }

    console.log('🌱 Reactions seeded successfully 🌱');
  } catch (error) {
    console.log(error);
  }
};

export const clearReactions = async () => {
  await Reaction.deleteMany({});
  console.log('🗑️ All reactions deleted 🗑️');
};
