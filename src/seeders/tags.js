// 各のspaceにtagを持たせなきゃいけなく、そのtagのdocumentを作らないといけない。
import Tag from '../models/tag.js';
import Space from '../models/space.js';
import Icon from '../models/icon.js';

// space作った人がcreatedByになるべき。
const tags = [
  {
    icon: null,
    name: 'general',
    color: 'white',
    space: null,
    createdBy: null,
  },
  {
    icon: null,
    name: 'Winter vacation',
    color: 'white',
    space: null,
    createdBy: null,
  },
  {
    icon: null,
    name: 'Pizza time!',
    color: 'white',
    space: null,
    createdBy: null,
  },
  {
    icon: null,
    name: 'BBQ',
    color: 'white',
    space: null,
    createdBy: null,
  },
  {
    icon: null,
    name: 'Josh growth record',
    color: 'white',
    space: null,
    createdBy: null,
  },
  {
    icon: null,
    name: 'Our sports time!',
    color: 'white',
    space: null,
    createdBy: null,
  },
  {
    icon: null,
    name: 'Venice vacation',
    color: 'white',
    space: null,
    createdBy: null,
  },
  {
    icon: null,
    name: 'Trip',
    color: 'white',
    space: null,
    createdBy: null,
  },
  {
    icon: null,
    name: 'Birthdays',
    color: 'white',
    space: null,
    createdBy: null,
  },
];

// iconのidをどうするかだね。。。hashでいいかね。これごとにiconを持つのも面倒だしな。。。
export const seedTags = async () => {
  try {
    await Tag.deleteMany({});
    console.log('🗑️ All tag documents deleted 🗑️');
    const hashTagIcon = await Icon.findOne({ name: 'hash' });

    // まずspaceをfetchしてくる必要があると。
    const spaces = await Space.find();
    // spaceごとにtagを作っていく必要があるのかな？
    for (const space of spaces) {
      for (const tag of tags) {
        const newTag = new Tag({
          ...tag,
          icon: hashTagIcon._id,
          space: space._id,
          createdBy: space.createdBy,
        });
        await newTag.save();
      }
    }
    console.log('🌱 All tags created 🌱');
  } catch (error) {
    console.error(error);
  }
};
