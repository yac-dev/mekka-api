import Comment from '../models/comment.js';
import Post from '../models/post.js';
import { Expo } from 'expo-server-sdk';
const expo = new Expo();

export const createComment = async (request, response) => {
  try {
    const comment = await Comment.create({
      content: request.body.content,
      post: request.body.postId,
      createdBy: request.body.userId,
      createdAt: new Date(),
    });

    const post = await Post.find({ _id: request.body.postId }).populate({
      path: 'createdBy',
    });

    // ---
    let notificationTitle = '';

    const notificationData = {
      notificationType: 'Reaction',
    };
    // spaceの名前, idも必要だな。。。
    // 誰々があなたの投稿にコメントしました。
    // if (post.createdBy.pushToken) {
    //   const chunks = expo.chunkPushNotifications({
    //     to: post.createdBy.pushToken,
    //     sound: 'default',
    //     data: notificationData,
    //     title: 'Reacted to your post.',
    //   });
    //   // emojiを含める感じか。。。

    //   const tickets = [];

    //   for (let chunk of chunks) {
    //     try {
    //       let receipts = await expo.sendPushNotificationsAsync(chunk);
    //       tickets.push(...receipts);
    //       console.log('Push notifications sent:', receipts);
    //     } catch (error) {
    //       console.error('Error sending push notification:', error);
    //     }
    //   }
    //   // これあれか、notificationのdocumentも作らないといけない感じか。。。
    //   // commentとreactionの時にnotificationのdocumentを作って、
    // }
    // if (post.createdBy.pushToken) {
    //   console.log('token', post.createdBy.pushToken);
    //   if (!Expo.isExpoPushToken(post.createdBy.pushToken)) {
    //     console.error(`expo-push-token is not a valid Expo push token`);
    //   }
    //   const notifyMessage = {
    //     to: post.createdBy.pushToken,
    //     sound: 'default',
    //     data: notificationData,
    //     title: 'Got comment',
    //     body: 'Got comment',
    //   };
    //   const messages = [];
    //   messages.push(notifyMessage);
    //   const chunks = expo.chunkPushNotifications(messages);

    //   const tickets = [];

    //   try {
    //     (async () => {
    //       for (const chunk of chunks) {
    //         try {
    //           const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    //           tickets.push(...ticketChunk);
    //         } catch (error) {
    //           console.error(error);
    //         }
    //       }
    //     })();
    //   } catch (error) {
    //     console.error(error);
    //   }
    // }

    response.status(201).json({
      comment,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getComments = async (request, response) => {
  try {
    const { postId } = request.params;
    const comments = await Comment.find({ post: postId, createdBy: { $ne: null } }).populate([
      { path: 'createdBy', model: 'User' },
      { path: 'reply', model: 'Comment' },
    ]);
    response.status(200).json({
      data: {
        comments,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
