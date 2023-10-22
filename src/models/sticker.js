import mongoose from 'mongoose';

const stickerSchema = mongoose.Schema({
  url: String,
  name: String,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  isPublic: Boolean, // app内の人も使えるようにするかどうか。
});

const Sticker = mongoose.model('Sticker', stickerSchema);

export default Sticker;
