// 各のspaceにtagを持たせなきゃいけなく、そのtagのdocumentを作らないといけない。
import Tag from '../models/tag.js';
import Space from '../models/space.js';
import Icon from '../models/icon.js';
import mongoose from 'mongoose';

// space作った人がcreatedByになるべき。
const tags = [
  {
    icon: '65bbaa7637c9fbbd20c15363',
    name: 'general',
    color: '',
    space: null,
    createdBy: null,
  },
  {
    icon: '6644b3bdfb287a658fac054a',
    name: 'Winter vacation',
    color: '',
    space: null,
    createdBy: null,
  },
  {
    icon: '6644b368fb287a658fac0548',
    name: 'Pizza time!',
    color: '',
    space: null,
    createdBy: null,
  },
  {
    icon: '6644b396fb287a658fac0549',
    name: 'BBQ',
    color: '',
    space: null,
    createdBy: null,
  },
  {
    icon: '66aa31cf529627a835f883ad',
    name: 'Josh growth record',
    color: '',
    space: null,
    createdBy: null,
  },
  {
    icon: '66aa3067529627a835f883a9',
    name: 'Our sports time!',
    color: '',
    space: null,
    createdBy: null,
  },
  {
    icon: '66aa3069529627a835f883aa',
    name: 'Venice vacation',
    color: '',
    space: null,
    createdBy: null,
  },
  {
    icon: '66aa31f6529627a835f883ae',
    name: 'Trip',
    color: '',
    space: null,
    createdBy: null,
  },
  {
    icon: '6644b3e2fb287a658fac054b',
    name: 'Birthdays',
    color: '',
    space: null,
    createdBy: null,
  },
];

const colorOptios = [
  'red1',
  'yellow1',
  'orange1',
  'blue1',
  'violet1',
  'lightGreen1',
  'green1',
  'lightBlue1',
  'pink1',
  'black1',
  'brown1',
];

// iconのidをどうするかだね。。。hashでいいかね。これごとにiconを持つのも面倒だしな。。。
export const seedTags = async () => {
  try {
    await Tag.deleteMany({});
    console.log('🗑️ All tag documents deleted 🗑️');
    const hashTagIcon = await Icon.findOne({ name: 'hash' });
    const icons = await Icon.find();

    // まずspaceをfetchしてくる必要があると。
    const spaces = await Space.find();
    // spaceごとにtagを作っていく必要があるのかな？
    for (const space of spaces) {
      for (const tag of tags) {
        const newTag = new Tag({
          ...tag,
          icon: new mongoose.Types.ObjectId(tag.icon),
          space: space._id,
          createdBy: space.createdBy,
          color: colorOptios[Math.floor(Math.random() * colorOptios.length)],
        });
        await newTag.save();
      }
    }
    console.log('🌱 All tags created 🌱');
  } catch (error) {
    console.error(error);
  }
};
