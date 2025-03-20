import Comment from '../models/comment.js';
import User from '../models/user.js';
import Post from '../models/post.js';

const contents = ['Best day ever', 'Happy day', 'WTF?!', 'Good weather', 'Love this!', 'Epic moment'];

export const seedComments = async () => {
  try {
    await Comment.deleteMany({});
    console.log('🗑️ All post documents deleted 🗑️');

    const posts = await Post.find({});
    const users = await User.find({});
    for (const post of posts) {
      for (const user of users) {
        const content = contents[Math.floor(Math.random() * contents.length)];
        const content2 = contents[Math.floor(Math.random() * contents.length)];
        const newComment = new Comment({
          content,
          post: post._id,
          createdBy: user._id,
          createdAt: new Date(),
        });
        const newComment2 = new Comment({
          content: content2,
          post: post._id,
          createdBy: user._id,
          createdAt: new Date(),
        });
        await newComment.save();
        await newComment2.save();
      }
    }
    console.log('🌱 All comments seeded successfully 🌱');
  } catch (error) {
    console.error('🚨 Error seeding posts:', error);
  }
};

export const clearComments = async () => {
  await Comment.deleteMany({});
  console.log('🗑️ All comment documents deleted 🗑️');
};
