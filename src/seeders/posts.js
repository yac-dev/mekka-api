import Space from '../models/space.js';
import Content from '../models/content.js';
import Post from '../models/post.js';
import User from '../models/user.js';

// そもそも、postの種類自体は多分15種類くらいでいんだろう。使うcontentや写真も共通のものをつかえばいい。ただ、postのidが違うだけになる感じで。
// どうしようか。

// pizza, winter使ってpost作るのはいんだけど。
// tagに関してはどうしようか。。。
// post and tagの方か、、、、
// pizza, winterごとに、100個のpostを作ったりっていう感じかね。。。
// 1つのcontent使って、1つのpostを作る、合計120個のpost document作る様にしたい。

const captions = ['Best day ever', 'Happy day', 'WTF?!', 'Good weather'];

const locations = [
  { type: 'Point', coordinates: [120, 30] },
  { type: 'Point', coordinates: [121, 31] },
  { type: 'Point', coordinates: [122, 32] },
  { type: 'Point', coordinates: [123, 33] },
];

const post = [
  {
    contents: null,
    type: 'normal',
    caption: 'Best day ever',
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
  try {
    await Post.deleteMany({});
    console.log('🗑️ All post documents deleted 🗑️');

    const contents = await Content.find({});
    const spaces = await Space.find({});
    const users = await User.find({});
    // 各spaceごとにpostを作る。
    // ３重ループだが、まあ仕方ないな。。。
    // ここのpost 216こできちゃっているね。。。どうしよか。。。
    for (const space of spaces) {
      for (const content of contents) {
        for (const user of users) {
          const caption = captions[Math.floor(Math.random() * captions.length)];
          const location = locations[Math.floor(Math.random() * locations.length)];
          const newPost = new Post({
            ...post,
            content: [content._id],
            caption,
            space: space._id,
            createdBy: user._id,
            location,
          });
          await newPost.save();
        }
      }
    }

    console.log('🌱 All posts seeded successfully 🌱');
  } catch (error) {
    console.error('🚨 Error seeding posts:', error);
  }
};
