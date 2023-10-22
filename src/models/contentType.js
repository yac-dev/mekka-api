import mongoose from 'mongoose';

const contentTypeSchema = mongoose.Schema({
  type: String, // photo video
});

const ContentType = mongoose.model('ContentType', contentTypeSchema);

export default ContentType;
