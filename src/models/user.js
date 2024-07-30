import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';

// schemaのエラーってどう扱ったらいい？ここでエラーが起きても、handlerでエラーをあつかってくれねーんだよな。。。
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: [true, 'This email has already been taken.'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide the valid email.'],
  },
  password: {
    type: String,
    required: true,
    minlength: [10, 'Password should be at least 10 characters long.'],
    // validate: {
    //   validator: function (val) {
    //     return val.length >= 12 || val.length === 0;
    //   },
    //   message: () => `Enrollment number must be at least 12 characters long`,
    // },
  },
  avatar: String, // s3 link
  pushToken: String,
  membershipStatus: {
    type: mongoose.Schema.ObjectId,
    ref: 'MembershipStatus',
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

// userSchema.set('toJSON', { virtuals: true });
// userSchema.set('toObject', { virtuals: true });

userSchema.methods.isPasswordCorrect = async (enteredPassword, actualPassword) => {
  return await bcrypt.compare(enteredPassword, actualPassword);
};

const User = mongoose.model('User', userSchema);
export default User;
