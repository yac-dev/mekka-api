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
    post.totalComments++;
    post.save();

    // ---
    let notificationTitle = '';

    const notificationData = {
      notificationType: 'Reaction',
    };
    // spaceの名前, idも必要だな。。。
    // 誰々があなたの投稿にコメントしました。
    if (post.createdBy.pushToken) {
      const chunks = expo.chunkPushNotifications({
        to: post.createdBy.pushToken,
        sound: 'default',
        data: notificationData,
        title: 'Reacted to your post.',
      });
      // emojiを含める感じか。。。

      const tickets = [];

      for (let chunk of chunks) {
        try {
          let receipts = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...receipts);
          console.log('Push notifications sent:', receipts);
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }
      // これあれか、notificationのdocumentも作らないといけない感じか。。。
      // commentとreactionの時にnotificationのdocumentを作って、
    }

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
      comments,
    });
  } catch (error) {
    console.log(error);
  }
};
