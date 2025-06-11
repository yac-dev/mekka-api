import Reply from '../models/reply.js';
import Comment from '../models/comment.js';
import Notification from '../models/notification.js';
import { Expo } from 'expo-server-sdk';
const expo = new Expo();

export const createReply = async (request, response, next) => {
  try {
    const { commentId, content, userId } = request.body;
    let reply = await Reply.create({
      comment: commentId,
      content,
      createdBy: userId,
      createdAt: new Date(),
    });
    reply = await reply.populate({
      path: 'createdBy',
      select: '_id name avatar',
    });

    // const comment = await Comment.findById(commentId).populate({
    //   path: 'createdBy',
    // });

    // if (comment.createdBy._id.toString() !== userId.toString()) {
    //   const notification = await Notification.create({
    //     to: comment.createdBy._id,
    //     type: 'comment',
    //     post: comment.post,
    //     space: spaceId,
    //     comment: comment._id,
    //     createdBy: userId,
    //     createdAt: new Date(),
    //   });

    //   const notificationData = {
    //     type: 'comment',
    //     postId: comment.post,
    //     commentId: comment._id,
    //   };

    //   if (comment.createdBy.pushToken) {
    //     console.log('token', comment.createdBy.pushToken);
    //     if (!Expo.isExpoPushToken(comment.createdBy.pushToken)) {
    //       console.error(`expo-push-token is not a valid Expo push token`);
    //     }
    //     const notifyMessage = {
    //       to: comment.createdBy.pushToken,
    //       sound: 'default',
    //       data: notificationData,
    //       title: `📨 ${userName} replied to your comment`,
    //       body: content,
    //     };
    //     const messages = [];
    //     messages.push(notifyMessage);
    //     const chunks = expo.chunkPushNotifications(messages);

    //     const tickets = [];

    //     try {
    //       (async () => {
    //         for (const chunk of chunks) {
    //           try {
    //             const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    //             tickets.push(...ticketChunk);
    //             console.log('Push notifications sent:', ticketChunk);
    //           } catch (error) {
    //             console.error(error);
    //           }
    //         }
    //       })();
    //     } catch (error) {
    //       console.error(error);
    //     }
    //   }
    // }

    response.status(201).json({
      data: {
        reply,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
