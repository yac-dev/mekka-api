import User from '../models/user.js';
import EmailAndPINCodeRelationship from '../models/emailAndPINCodeRelationship.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { AppError } from '../utils/AppError.js';
import { MembershipStatus } from '../models/membershipStatus.js';
import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
// import mailgun from 'mailgun-js'
// signupで、membershipもつくりたいな。。。
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import util from 'util';
import AWS from 'aws-sdk';
import { uploadContentToS3, deleteContentFromS3 } from '../services/s3.js';
import Notification from '../models/notification.js';

const deleteFromS3 = async (fileName) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `avatar/${fileName}`,
  };
  return s3.deleteObject(params).promise();
};

const unlinkFile = util.promisify(fs.unlink);

const getFilePath = (fileName) => {
  return path.join(path.resolve(), 'buffer', fileName);
};

const removeFile = async (fileName) => {
  const filePath = getFilePath(fileName);
  await unlinkFile(filePath);
};

const optimizeImage = async (inputFileName, resolution, fit = 'contain') => {
  const fileInput = getFilePath(inputFileName);
  const processed = await sharp(fileInput)
    .rotate()
    .resize({ height: resolution.height, width: resolution.width, fit })
    .withMetadata()
    .webp({ quality: 1 })

    .toBuffer();
  return processed;
};

const processAvatar = async (fileName, resolution) => {
  // Optimize the icon image
  const iconBinary = await optimizeImage(fileName, resolution);
  // Upload the optimized icon to S3
  await uploadContentToS3(fileName, 'avatars', iconBinary);
  // Remove the local file
  await removeFile(fileName);
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.NODEMAILER_USER, // senderのgmailをここに（俺のgmailでとりあえず）
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export const signup = async (request, response, next) => {
  try {
    const { name, email, password, spaceId } = request.body;

    if (password.length < 10) {
      throw new Error('Password has to be at least 10 characters long.');
    }
    const alreadyExistUser = await User.findOne({ email });
    if (alreadyExistUser) {
      throw new Error('The user with this email already exists.');
    }
    const randomAvatarNumber = Math.floor(Math.random() * 24) + 1;

    const membershipStatus = await MembershipStatus.create({
      status: 'normal',
    });

    const user = new User({
      name,
      email,
      avatar: null,
      password,
      membershipStatus: membershipStatus._id,
      pushToken: '',
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_PRIVATE_KEY);

    if (spaceId) {
      await SpaceAndUserRelationship.create({
        user: user._id,
        space: spaceId,
        createdAt: new Date(),
        lastCheckedIn: new Date(),
      });
    }

    response.status(201).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          pushToken: user.pushToken,
          createdAt: user.createdAt,
        },
        jwt: jwtToken,
      },
    });
  } catch (error) {
    response.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

export const loadMe = async (request, response) => {
  const { user } = request;
  try {
    const notificationOpenedAt = user.notificationOpenedAt;
    let hasNewNotification = false;
    if (!notificationOpenedAt) {
      hasNewNotification = await Notification.exists({
        to: user._id,
      });
    } else {
      hasNewNotification = await Notification.exists({
        to: user._id,
        createdAt: { $gt: notificationOpenedAt },
      });
    }

    response.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          pushToken: user.pushToken,
          createdAt: user.createdAt,
          notificationOpenedAt: user.notificationOpenedAt,
          hasNewNotification,
        },
      },
    });
  } catch (error) {
    response.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email });

    if (!user) {
      // return next(new AppError("The user doesn't exist.", 400));
      throw new Error("The user doesn't exist.");
    }
    console.log('user', user);

    const isEnteredPasswordCorrect = await user.isPasswordCorrect(password, user.password);
    if (!isEnteredPasswordCorrect) {
      // return next(new AppError('Something went wrong with your email or password.', 400));
      throw new Error('Something went wrong with your email or password.');
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_PRIVATE_KEY);

    response.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          pushToken: user.pushToken,
          createdAt: user.createdAt,
        },
        jwt: jwtToken,
      },
    });
  } catch (error) {
    console.log('error is this ->', error.message);
    response.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

export const deleteMe = async (request, response, next) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("The user doesn't exist.", 400));
  }

  const isEnteredPasswordCorrect = await user.isPasswordCorrect(password, user.password);
  if (!isEnteredPasswordCorrect) {
    return next(new AppError('Something went wrong with your email or password.', 400));
  }

  await User.deleteOne({ email: user.email });

  response.status(204).json({
    status: 'success',
  });
};

// signup後にpushTokenを登録する感じか。
export const registerPushToken = async (request, response) => {
  try {
    const user = await User.findById(request.params.userId);
    user.pushToken = request.body.pushToken;
    user.save();
    response.status(200).json({
      message: 'success',
    });
  } catch (error) {
    console.log(error);
  }
};

export const forgotPassword = async (request, response, next) => {
  const { email } = request.body;
  const user = await User.findOne({ email }); // userが見つかったら、emailとpinでrecordを作る感じ。
  if (user) {
    const PINCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMinutes(now.getMinutes() + 30);
    const emailAndPINRelationship = await EmailAndPINCodeRelationship.create({
      email,
      PINCode,
      createdAt: now,
      expiresAt: expiresAt, // 30分後には使えないようにする。
    });

    const mailOptions = {
      from: {
        name: 'Mekka support',
        address: process.env.NODEMAILER_USER,
      },
      to: user.email,
      subject: `${user.name}, here's your PIN ${PINCode}`,
      html: `
          <h2>Hi ${user.name}.</h2>
          <br>
          <p>This is your temporary pin code.</p>
          <br>
          <h2>${PINCode}</h2>
          <p>Please go back to Mekka, enter this pin and complete the reset.</p>
          <br>
          `,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    response.status(200).json({
      message: 'success',
    });
  } else {
    return next(new AppError('No user...', 400));
  }
};

// pincodeのfield名ややこしいから変えよう。
export const checkPINcode = async (request, response, next) => {
  const { email, PINCode } = request.body;
  const emailAndPINRelationship = await EmailAndPINCodeRelationship.findOne({ email, PINCode });
  if (emailAndPINRelationship) {
    response.status(200).json({
      status: 'success',
      data: {
        email,
      },
    });
  } else {
    return next(new AppError("PIN code doesn't match...", 400));
  }
};

// ここ、pinまで着ないといけないようにしたいわな。middleware的な。。。
// app側は、navigationで制御できるが、api側はまだだよな。。。
export const updatePassword = async (request, response, next) => {
  console.log(request.body);
  const { password, email } = request.body;
  // console.log('input password', password);
  // console.log('input email', email);
  // emailがねーや。。。
  if (password.length < 10) {
    return next(new AppError('Password has to be at least 10 characters long.', 400));
  }

  const user = await User.findOne({ email });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  await user.save();

  response.status(200).json({
    status: 'success',
  });
};

// password送られて新しくする感じ、
// sendgridなんか使って、userにmailを送る。
export const requestResetPassword = async (request, response, next) => {
  try {
    // emailがbodyに来る。
    // emailをdbから見つけたら、send gridに送る。
    const { email } = request.body;
    const user = await User.find({ email });
    if (user) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: email, // Change to your recipient
        from: 'lamposttech@gmail.com', // Change to your verified sender
        subject: 'Password Reset Request for Mekka',
        text: `Hey ${user.name}, Your Mekka password can be reset by clicking the button below. If you did not request a new password, please ignore this email.`,
        html: '<p>Click on this <a href=`https://${req.headers.host}/password/reset/${user.passwordResetToken}`>link</a> to reset your password.</p>',
      };
      // mekkaのweb appをnetrifyなんかに上げてそのurlを取っておく、それをここに設定する感じかな。
      sgMail
        .send(msg)
        .then(() => {
          console.log('Email sent');
          response.status(200).json({
            message: 'success',
          });
        })
        .catch((error) => {
          console.log('sendgrid error ->', error);
          response.status.json({
            message: 'error',
          });
        });
    } else {
      response.status(200).json({
        message: 'success',
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// 基本全部送るようにしようかね。。。
export const updateMe = async (request, response, next) => {
  try {
    const { name, email, notificationOpenedAt } = request.body;
    console.log('update me 動いてる？', request.body);
    const user = await User.findById(request.params.userId);
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if (request.file) {
      if (user.avatar) {
        const currentAvatarFileName = user.avatar.split('/').pop();
        await deleteContentFromS3(currentAvatarFileName, 'avatars');
      }

      const newAvatarFileName = request.file.filename;
      await processAvatar(newAvatarFileName, { width: 500, height: 500 });
      user.avatar = `${process.env.CLOUDFRONT_URL}avatars/${newAvatarFileName}`;
    }
    if (notificationOpenedAt) {
      user.notificationOpenedAt = notificationOpenedAt;
    }
    user.save();
    console.log('send response user', user);
    response.status(200).json({
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          notificationOpenedAt: user.notificationOpenedAt,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
};
