import { PostAndReactionAndUserRelationship } from '../models/postAndReactionAndUserRelationship.js';
import Post from '../models/post.js';
import User from '../models/user.js';
import Sticker from '../models/sticker.js';

export const seedPostAndReactionAndUserRelationships = async () => {
  try {
    await PostAndReactionAndUserRelationship.deleteMany({});
    console.log('🗑️ All post and reaction and user relationships deleted 🗑️');

    // spaceのreactionがまず必要になるわけで。。。
    const posts = await Post.find().populate({
      path: 'space',
      populate: [
        {
          path: 'reactions',
          select: '_id type emoji sticker',
          model: 'Reaction',
          // populate: {
          //   path: 'sticker',
          //   model: 'Sticker',
          // },
        },
        {
          path: 'createdBy',
          select: '_id name avatar',
        },
      ],
    });

    // postが持っているreactionをとuser idでpostAndReactionAndUserRelationships を作りたい。
    for (const post of posts) {
      for (const reaction of post.space.reactions) {
        const postAndReactionAndUserRelationship = new PostAndReactionAndUserRelationship({
          post: post._id,
          reaction: reaction._id,
          user: post.createdBy._id,
        });
        await postAndReactionAndUserRelationship.save();
      }
    }
    console.log('🌱 All post and reaction and user relationships created 🌱');
  } catch (error) {
    console.error('Error deleting post and reaction and user relationships:', error);
  }
};

export const clearPostAndReactionAndUserRelationships = async () => {
  await PostAndReactionAndUserRelationship.deleteMany({});
  console.log('🗑️ All post and reaction and user relationships deleted 🗑️');
};
