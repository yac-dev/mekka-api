import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import sgMail from '@sendgrid/mail';
import { AppError } from '../utils/AppError.js';

export const signup = async (request, response, next) => {
  const { name, email, password } = request.body;

  if (password.length < 10) {
    return next(new AppError('Password has to be at least 10 characters long.', 400));
  }
  const alreadyExistUser = await User.findOne({ email });
  if (alreadyExistUser) {
    return next(new AppError('The user with this email already exists.', 400));
  }
  const randomAvatarNumber = Math.floor(Math.random() * 24) + 1;
  const user = new User({
    name,
    email,
    avatar: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/avatars/default-avatar-${randomAvatarNumber}.png`,
    password,
    createdAt: new Date(),
    pushToken: '',
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_PRIVATE_KEY);

  response.status(201).json({
    status: 'success',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      jwt: jwtToken,
    },
  });
};

export const loadMe = async (request, response) => {
  const { user } = request;
  response.status(200).json({
    user,
  });
};

export const login = async (request, response, next) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("The user doesn't exist.", 400));
  }

  const isEnteredPasswordCorrect = await user.isPasswordCorrect(password, user.password);
  if (!isEnteredPasswordCorrect) {
    return next(new AppError('Something went wrong with your email or password.', 400));
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

// sendgridなんか使って、userにmailを送る。
export const requestResetPassword = async (request, response) => {
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

export const resetPassword = (request, response) => {
  try {
  } catch (error) {
    console.log(error);
  }
};
