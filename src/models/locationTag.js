import mongoose from 'mongoose';

// だから、lastUpdateするのは、first tagだけでいいかも。。。
// 一番最初にlocationTagを作った人がこのlocationを作って、自分のpostにも同じcoordsを割り当てることになるね。
const locationTagSchema = mongoose.Schema({
  iconType: String, // icon or image
  icon: String, // url
  image: String, // url
  name: String,
  color: String,
  point: {
    // 初めにzoomの中心となる場所の感じかな。
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
  },
  // だから、それぞれのpostがlocationを持っておく必要はなくなるな。
  // lastUpdatedを持っておけばいいのかもしれないが、、、さらに数を出したいとなると、、、、
  count: Number,
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  updatedAt: Date,
});

const LocationTag = mongoose.model('LocationTag', locationTagSchema);

export default LocationTag;
