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
  { type: 'Point', coordinates: [9.42, 50.37] },
  { type: 'Point', coordinates: [4.6, 47.68] },
  { type: 'Point', coordinates: [8.33, 46.52] },
  { type: 'Point', coordinates: [0.49, 44.01] },
  { type: 'Point', coordinates: [15.38, 47.88] },
  { type: 'Point', coordinates: [16.77, 49.55] },
  { type: 'Point', coordinates: [17.86, 47.37] },
  { type: 'Point', coordinates: [5.85, 52.58] },
  { type: 'Point', coordinates: [12.52, 48.31] },
  { type: 'Point', coordinates: [17.17, 50.94] },
  { type: 'Point', coordinates: [1.06, 42.6] },
  { type: 'Point', coordinates: [-1.35, 51.18] },
  { type: 'Point', coordinates: [31.23573, 30.0444] },
  { type: 'Point', coordinates: [7.9898, 31.2357] },
  { type: 'Point', coordinates: [10.181667, 36.806389] },
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
    const spaces = await Space.find();
    const users = await User.find({});
    const normalContents = contents.filter(
      (content) => content.data.includes('pizza') || content.data.includes('winter')
    );

    const momentContents = contents.filter((content) => content.data.includes('moment'));

    // 各spaceごとにpostを作る。
    // ３重ループだが、まあ仕方ないな。。。
    // ここのpost 216こできちゃっているね。。。どうしよか。。。
    // for (const space of spaces) {
    for (const content of normalContents) {
      // for (const user of users) {
      //   const caption = captions[Math.floor(Math.random() * captions.length)];
      //   const location = locations[Math.floor(Math.random() * locations.length)];
      //   const newPost = new Post({
      //     ...post,
      //     content: [content._id],
      //     caption,
      //     space: space._id,
      //     createdBy: user._id,
      //     location,
      //   });
      //   await newPost.save();
      // }
      const caption = captions[Math.floor(Math.random() * captions.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const newPost = new Post({
        ...post,
        type: 'normal',
        contents: [content._id],
        caption,
        // space: space._id,
        space: spaces[0]._id,
        createdBy: users[0]._id,
        createdAt: new Date(),
        location,
      });
      await newPost.save();
    }
    for (const content of normalContents) {
      // for (const user of users) {
      //   const caption = captions[Math.floor(Math.random() * captions.length)];
      //   const location = locations[Math.floor(Math.random() * locations.length)];
      //   const newPost = new Post({
      //     ...post,
      //     content: [content._id],
      //     caption,
      //     space: space._id,
      //     createdBy: user._id,
      //     location,
      //   });
      //   await newPost.save();
      // }
      const caption = captions[Math.floor(Math.random() * captions.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const newPost = new Post({
        ...post,
        type: 'normal',
        contents: [content._id],
        caption,
        // space: space._id,
        space: spaces[0]._id,
        createdBy: users[0]._id,
        createdAt: new Date(),
        location,
      });
      await newPost.save();
    }
    for (const content of normalContents) {
      // for (const user of users) {
      //   const caption = captions[Math.floor(Math.random() * captions.length)];
      //   const location = locations[Math.floor(Math.random() * locations.length)];
      //   const newPost = new Post({
      //     ...post,
      //     content: [content._id],
      //     caption,
      //     space: space._id,
      //     createdBy: user._id,
      //     location,
      //   });
      //   await newPost.save();
      // }
      const caption = captions[Math.floor(Math.random() * captions.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const newPost = new Post({
        ...post,
        type: 'normal',
        contents: [content._id],
        caption,
        // space: space._id,
        space: spaces[0]._id,
        createdBy: users[0]._id,
        createdAt: new Date(),
        location,
      });
      await newPost.save();
    }
    // }

    // momentsをここで作る。
    // for (const space of spaces) {
    for (const content of momentContents) {
      const caption = captions[Math.floor(Math.random() * captions.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const now = new Date();
      // need one day later for now
      // const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      // momentは今よりも明日で
      const randomDisappearAt = new Date(now.getTime() + Math.random() * 24 * 60 * 60 * 1000);

      const newPost = new Post({
        ...post,
        type: 'moment',
        contents: [content._id],
        caption,
        // space: space._id,
        space: spaces[0]._id,
        createdBy: users[0]._id,
        createdAt: now,
        location,
        disappearAt: randomDisappearAt,
      });
      await newPost.save();
      // }
    }

    for (const content of momentContents) {
      const caption = captions[Math.floor(Math.random() * captions.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const now = new Date();
      // need one day later for now
      // const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      // momentは今よりも明日で
      const randomDisappearAt = new Date(now.getTime() + Math.random() * 24 * 60 * 60 * 1000);

      const newPost = new Post({
        ...post,
        type: 'moment',
        contents: [content._id],
        caption,
        // space: space._id,
        space: spaces[0]._id,
        createdBy: users[0]._id,
        createdAt: now,
        location,
        disappearAt: randomDisappearAt,
      });
      await newPost.save();
      // }
    }

    console.log('🌱 All posts seeded successfully 🌱');
  } catch (error) {
    console.error('🚨 Error seeding posts:', error);
  }
};
