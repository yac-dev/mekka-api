import User from '../models/user.js';
import Space from '../models/space.js';
import Reaction from '../models/reaction.js';
import mongoose from 'mongoose';

// それぞれのuserがそれぞれのspaceとrelationshipを持つ様に作りたいね。
// 一人のuserに3つのspaceをもつ感じ。
const spaces = [
  {
    name: 'Bros',
    icon: 'https://mekka-dev.s3.us-east-2.amazonaws.com/icons/default_space_1.jpg', // s3のlink
    secretKey: '123456789012',
    contentType: 'photoAndVideo',
    description: 'This is the space 1',
    videoLength: 20,
    disappearAfter: 1439,
    isPublic: false,
    isCommentAvailable: true,
    isReactionAvailable: true,
  },
  {
    name: "John Smith's",
    icon: 'https://mekka-dev.s3.us-east-2.amazonaws.com/icons/default_space_2.jpg', // s3のlink
    secretKey: '234567890123',
    contentType: 'photo',
    description: 'This is the space 2',
    disappearAfter: 5,
    isPublic: false,
    isCommentAvailable: true,
    isReactionAvailable: true,
  },
  {
    name: 'Dog Lovers',
    icon: 'https://mekka-dev.s3.us-east-2.amazonaws.com/icons/default_space_3.jpg', // s3のlink
    secretKey: '3456789012345',
    contentType: 'video',
    description: 'This is the space 3',
    videoLength: 5,
    disappearAfter: 120,
    isPublic: true,
    isCommentAvailable: true,
    isReactionAvailable: true,
  },
];

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

export const seedSpaces = async () => {
  try {
    // 最初に消す。
    await Space.deleteMany({});
    await Reaction.deleteMany({});
    console.log('🗑️ All spaces and reactions deleted 🗑️');

    const users = await User.find(); // 全ユーザーを取得
    const reactionDocs = await Reaction.insertMany(reactions); // リアクションを挿入

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const spaceData = spaces[i % spaces.length]; // ユーザーごとに1つのスペースを割り当てる
      const space = new Space({
        ...spaceData,
        createdBy: user._id,
        reactions: reactionDocs.map((reaction) => reaction._id),
      });
      await space.save();
    }
    console.log('🌱 Space and reaction documents seeded successfully 🌱');
  } catch (error) {
    console.log(error);
  }
};
