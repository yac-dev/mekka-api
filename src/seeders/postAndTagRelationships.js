import PostAndTagRelationship from '../models/postAndTagRelationship.js';
import Tag from '../models/tag.js';
import Post from '../models/post.js';

export const seedPostAndTagRelationships = async () => {
  try {
    await PostAndTagRelationship.deleteMany({});
    console.log('🗑️ PostAndTagRelationship cleared 🗑️');

    const tags = await Tag.find({});
    const posts = await Post.find({ type: 'normal' }).populate([
      {
        path: 'contents',
        model: 'Content',
      },
      { path: 'createdBy', model: 'User', select: '_id name avatar' },
      { path: 'space', model: 'Space', select: 'reactions' },
    ]);

    for (const tag of tags) {
      for (const post of posts) {
        if (tag.name === 'Pizza time!' && post.contents[0].data.includes('pizza')) {
          const postAndTagRelationship = new PostAndTagRelationship({
            post: post._id,
            tag: tag._id,
          });
          await postAndTagRelationship.save();
        }
        if (tag.name === 'Winter vacation' && post.contents[0].data.includes('winter')) {
          const postAndTagRelationship = new PostAndTagRelationship({
            post: post._id,
            tag: tag._id,
          });
          await postAndTagRelationship.save();
        }
      }
    }
    console.log('🌱 All post and tag relationships seeded successfully 🌱');
  } catch (error) {
    console.log(error);
  }
};
