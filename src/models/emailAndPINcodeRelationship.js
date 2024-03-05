import mongoose from 'mongoose';

const emailAndPINcodeRelationship = mongoose.Schema({
  email: String,
  PINcode: Number, // 6桁のコード
  createdAt: Date,
  expiresAt: Date,
});

const EmailAndPINcodeRelationship = mongoose.model('EmailAndPINcodeRelationship', emailAndPINcodeRelationship);

export default EmailAndPINcodeRelationship;
