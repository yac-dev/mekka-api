import mongoose from 'mongoose';

// それぞれのmekkaで、人の貢献度みたいなのを出すといいかもな。。。まあ、あくまでこれはsub的な位置付けだけど。
// discordだと、それぞれの部屋でmemberの役割(role)を決められるみたいだね。そして、roleごとにできることを決められる見たい。
// 最終的に、各spaceのrateも出したい。
const spaceSchema = mongoose.Schema({
  name: String,
  icon: String, // s3のlink
  secretKey: String,
  contentType: {
    type: String,
    enum: ['photo', 'video', 'photoAndVideo'],
  },
  defaultTag: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tag',
  },
  description: String,
  videoLength: Number,
  disappearAfter: Number, // ここはminuteでいく。5, 60, 600, 1440って感じ。
  isPublic: {
    required: true,
    type: Boolean,
  },
  isCommentAvailable: {
    required: true,
    type: Boolean,
  },
  isReactionAvailable: {
    required: true,
    type: Boolean,
  },
  isFollowAvailable: {
    required: true,
    type: Boolean,
  },
  reactions: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Reaction',
    },
  ],
  rate: Number,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
  },
  hours: {
    from: {
      type: String,
      default: String, // 12am
      enum: [
        '12am',
        '1am',
        '2am',
        '3am',
        '4am',
        '5am',
        '6am',
        '7am',
        '8am',
        '9am',
        '10am',
        '11am',
        '12pm',
        '1pm',
        '2pm',
        '3pm',
        '4pm',
        '5pm',
        '6pm',
        '7pm',
        '8pm',
        '9pm',
        '10pm',
        '11pm',
      ],
    },
    to: {
      type: String,
      default: String, // 12pm 的な感じの値が入ることになる。まあここら辺の型を本来は制御した方がいいんだろうけど。。。
      enum: [
        '1am',
        '2am',
        '3am',
        '4am',
        '5am',
        '6am',
        '7am',
        '8am',
        '9am',
        '10am',
        '11am',
        '12pm',
        '1pm',
        '2pm',
        '3pm',
        '4pm',
        '5pm',
        '6pm',
        '7pm',
        '8pm',
        '9pm',
        '10pm',
        '11pm',
        '12am',
      ],
    },
  },
  capacity: {
    type: Number,
  },
  updatedAt: Date,
});

const Space = mongoose.model('Space', spaceSchema);
export default Space;
