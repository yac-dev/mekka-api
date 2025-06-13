import Reply from '../models/reply.js';
import Comment from '../models/comment.js';
import Notification from '../models/notification.js';
import { Expo } from 'expo-server-sdk';
const expo = new Expo();

export const createReply = async (request, response, next) => {
  try {
    const { commentId, content, senderId, receiverId } = request.body;
    let reply = await Reply.create({
      to: receiverId,
      comment: commentId,
      content,
      createdBy: senderId,
      createdAt: new Date(),
    });
    reply = await reply.populate([
      {
        path: 'comment',
        select: '_id post space',
        populate: {
          path: 'createdBy',
          select: '_id name avatar pushToken',
        },
      },
      {
        path: 'createdBy',
        select: '_id name avatar pushToken',
      },
      {
        path: 'to',
        select: '_id name avatar pushToken',
      },
    ]);

    if (senderId.toString() !== receiverId.toString()) {
      const notification = await Notification.create({
        to: receiverId,
        type: 'comment',
        post: reply.comment.post,
        space: reply.comment.post.space,
        comment: commentId,
        createdBy: senderId,
        createdAt: new Date(),
      });

      const notificationData = {
        type: 'comment',
        postId: reply.comment.post,
        commentId: reply.comment._id,
      };

      if (reply.to.pushToken) {
        console.log('token', reply.to.pushToken);
        if (!Expo.isExpoPushToken(reply.to.pushToken)) {
          console.error(`expo-push-token is not a valid Expo push token`);
        }
        const notifyMessage = {
          to: reply.to.pushToken,
          sound: 'default',
          data: notificationData,
          title: `📨 ${reply.createdBy.name} replied to your comment`,
          body: reply.content,
        };
        const messages = [];
        messages.push(notifyMessage);
        const chunks = expo.chunkPushNotifications(messages);

        const tickets = [];

        try {
          (async () => {
            for (const chunk of chunks) {
              try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
                console.log('Push notifications sent:', ticketChunk);
              } catch (error) {
                console.error(error);
              }
            }
          })();
        } catch (error) {
          console.error(error);
        }
      }
    }

    response.status(201).json({
      data: {
        reply,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
