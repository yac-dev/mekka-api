import Notification from '../models/notification.js';

// postした後にnotificationを作る。
export const createNotification = async (request, response) => {
  response.status(201).json({
    status: 'success',
    data: 'notification created',
  });
};
