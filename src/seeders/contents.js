import Content from '../models/content.js';
import User from '../models/user.js';

// s3の写真の名前でdetectしようか。￥
// data 自体は、https://mekka-dev.s3.us-east-2.amazonaws.com/photos/pizza_1.jpgか、https://mekka-dev.s3.us-east-2.amazonaws.com/photos/winter_1.jpg
// pizzaかwinterのどちらかなわけだ。ここはまあ別に作るときに動的に絞めれば良くて、、、
const contents = [
  {
    data: 'https://mekka-dev.s3.us-east-2.amazonaws.com/photos/pizza_1.jpg', // s3のlink
    type: 'photo',
    duration: null,
  },
  {
    data: 'https://mekka-dev.s3.us-east-2.amazonaws.com/photos/winter_1.jpg', // s3のlink
    type: 'photo',
    duration: null,
  },
];

const generateContents = () => {
  const contentTypes = ['pizza', 'winter'];
  const contents = [];

  contentTypes.forEach((contentType) => {
    for (let i = 1; i <= 12; i++) {
      contents.push({
        data: `https://mekka-dev.s3.us-east-2.amazonaws.com/photos/${contentType}_${i}.jpg`, // s3のlink
        type: 'photo',
        duration: null,
      });
    }
  });

  return contents;
};

export const seedContents = async () => {
  try {
    await Content.deleteMany({});
    console.log('🗑️ All content documents deleted 🗑️');

    const contents = generateContents();
    await Content.insertMany(contents);
    console.log('🌱 Content documents seeded 🌱');
  } catch (error) {
    console.log(error);
  }
};
