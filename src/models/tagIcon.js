import mongoose from 'mongoose';

const tagIconSchema = mongoose.Schema({
  type: String, // 'icon', 'image', 'emoji', 'sticker'
  icon: String, // url実際のdata
  image: String,
  // sticker: String,
});

const TagIcon = mongoose.model('TagIcon', tagIconSchema);

export default TagIcon;
