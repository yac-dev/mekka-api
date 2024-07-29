import Content from '../models/content.js';

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

const generateMomentContents = () => {
  const contents = [];

  for (let i = 1; i <= 15; i++) {
    contents.push({
      data: `https://mekka-dev.s3.us-east-2.amazonaws.com/photos/moment_${i}.jpg`, // s3のlink
      type: 'photo',
      duration: null,
    });
  }

  return contents;
};

export const seedContents = async () => {
  try {
    await Content.deleteMany({});
    console.log('🗑️ All content documents deleted 🗑️');

    const normalContents = generateContents();
    const momentContents = generateMomentContents();
    const contents = [...normalContents, ...momentContents];
    await Content.insertMany(contents);
    console.log('🌱 Content documents seeded 🌱');
  } catch (error) {
    console.log(error);
  }
};
