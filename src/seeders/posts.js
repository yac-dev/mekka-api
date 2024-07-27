// 最後のpostのseeder、ここ面倒くさいかもね。。
import Space from '../models/space.js';
import Post from '../models/post.js';
import User from '../models/user.js';
import Tag from '../models/tag.js';

// そもそも、postの種類自体は多分15種類くらいでいんだろう。使うcontentや写真も共通のものをつかえばいい。ただ、postのidが違うだけになる感じで。

const contents = [];

const posts = [
  {
    contents: [{ type: mongoose.Schema.ObjectId, ref: 'Content' }],
    type: 'normal',
    caption: 'Best day ever',
    // locationTag: { type: mongoose.Schema.ObjectId, ref: 'LocationTag' }, // これは一つのみ。
    space: null,
    createdBy: null,
    createdAt: new Date(),
    location: {
      type: 'Point',
      coordinates: [120, 30],
    },
    disappearAt: null,
  },
];

export const seedPosts = async () => {
  await Post.deleteMany({});
  console.log('🗑️ All post documents deleted 🗑️');
};
