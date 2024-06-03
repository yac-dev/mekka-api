import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { Schema, model, Document, Model } from 'mongoose';

type IUser = {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  pushToken?: string;
  createdAt: Date;
  isPasswordCorrect(enteredPassword: string, actualPassword: string): Promise<boolean>;
} & Document;

// schemaと実際のuserの形っって変わるもんな。。。そこを考えないとな。。。

type UserModel = Model<IUser>;

// schemaのエラーってどう扱ったらいい？ここでエラーが起きても、handlerでエラーをあつかってくれねーんだよな。。。
const userSchema = new Schema<IUser, UserModel>({
  name: {
    type: String,
    required: [true, 'Please provide your name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.'],
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
  createdAt: {
    type: Date,
    required: true,
  },
});

// userSchema.set('toJSON', { virtuals: true });
// userSchema.set('toObject', { virtuals: true });

userSchema.methods.isPasswordCorrect = async (enteredPassword: string, actualPassword: string) => {
  return await bcrypt.compare(enteredPassword, actualPassword);
};

export const User = model<IUser, UserModel>('User', userSchema);
