import mongoose from 'mongoose';

const emailAndPINCodeRelationshipSchema = mongoose.Schema({
  email: String,
  PINCode: Number, // 6桁のコード
  createdAt: Date,
  expiresAt: Date,
});

const EmailAndPINCodeRelationship = mongoose.model('EmailAndPINCodeRelationship', emailAndPINCodeRelationshipSchema);

export default EmailAndPINCodeRelationship;
