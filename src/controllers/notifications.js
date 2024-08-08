import Notification from '../models/notification.js';
import Space from '../models/space.js';
import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import { sendPushNotifications } from '../utils/pushNotification.js';

export const createPostNotification = async (request, response) => {
  const { postId, spaceId, createdBy } = request.body;
  const notification = await Notification.create({
    post: postId,
    space: spaceId,
    createdBy,
  });

  const populatedNotification = await Notification.populate(notification, [
    {
      path: 'post',
      select: '_id caption',
    },
    {
      path: 'space',
      select: '_id name',
    },
    {
      path: 'createdBy',
      select: '_id name avatar',
    },
  ]);

  if (!populatedNotification.space.isPublic) {
    const members = await SpaceAndUserRelationship.find({
      space: populatedNotification.space._id,
    }).populate('user');

    const filteredMembers = members.filter((member) => member.user);

    const pushTokens = filteredMembers.map((member) => member.user.pushToken);
    const notificationData = {};
    const notificationTitle = `${populatedNotification.createdBy.name} created a post`;
    const notificationBody = populatedNotification.post.caption;
    await sendPushNotifications(pushTokens, notificationData, notificationTitle, notificationBody);
  }

  if (populatedNotification.space.isPublic) {
    // publicであれば、自分をfollowしているユーザーに対してnotificationを送る感じか。
  }

  response.status(201).json({
    status: 'success',
    data: null,
  });
};
