import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  avatar: String, // s3 link
  pushToken: String,
  createdAt: Date,
});

// userSchema.set('toJSON', { virtuals: true });
// userSchema.set('toObject', { virtuals: true });

userSchema.methods.isPasswordCorrect = async (enteredPassword, actualPassword) => {
  return await bcrypt.compare(enteredPassword, actualPassword);
};

const User = mongoose.model('User', userSchema);
export default User;
