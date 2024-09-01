import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export const authorization = async (request, response, next) => {
  let token;
  if (request.headers.authorization && request.headers.authorization.startsWith('Bearer')) {
    token = request.headers.authorization.split(' ')[1];
  }

  if (token === 'null') {
    response.status(200).json({
      status: 'success',
      data: {
        user: null,
      },
    });
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY); // decoded {id: _id}っていう形。
  const user = await User.findById(decoded.id).select({
    _id: true,
    name: true,
    email: true,
    pushToken: true,
    avatar: true,
  });

  if (!user) {
    response.status(200).json({
      status: 'success',
      data: {
        user: null,
      },
    });
    return;
  }
  request.user = user;
  next();
};
