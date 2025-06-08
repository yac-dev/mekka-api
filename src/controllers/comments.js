import Reply from '../models/reply.js';
import Comment from '../models/comment.js';
import Post from '../models/post.js';
import Notification from '../models/notification.js';
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

    const post = await Post.findById(request.body.postId).populate({
      path: 'createdBy',
    });

    // 自分が自分のpostにコメントした場合は通知を作成しない
    if (post.createdBy._id.toString() !== request.body.userId.toString()) {
      const notification = await Notification.create({
        to: post.createdBy._id,
        type: 'comment',
        post: request.body.postId,
        space: post.space._id,
        comment: comment._id,
        createdBy: request.body.userId,
        createdAt: new Date(),
      });

      const notificationData = {
        type: 'comment',
        postId: request.body.postId,
        commentId: comment._id,
      };

      if (post.createdBy.pushToken) {
        console.log('token', post.createdBy.pushToken);
        if (!Expo.isExpoPushToken(post.createdBy.pushToken)) {
          console.error(`expo-push-token is not a valid Expo push token`);
        }
        const notifyMessage = {
          to: post.createdBy.pushToken,
          sound: 'default',
          data: notificationData,
          title: `💬 ${request.body.userName} commented on your post`,
          body: request.body.content,
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
        comment,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getComments = async (request, response) => {
  try {
    const { postId } = request.params;
    console.log('postId', postId);
    const sortingCondition = { _id: -1 };

    const comments = await Comment.find({ post: postId, createdBy: { $ne: null } })
      .sort(sortingCondition)
      .populate([
        { path: 'createdBy', model: 'User' },
        // { path: 'reply', model: 'Comment' },
      ]);
    console.log('comments', comments);
    response.status(200).json({
      data: {
        comments,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const createReply = async (request, response, next) => {
  try {
    const { commentId, content, userId, userName, spaceId } = request.body;
    const reply = await Reply.create({
      comment: commentId,
      content,
      createdBy: userId,
      createdAt: new Date(),
    });

    const comment = await Comment.findById(commentId).populate({
      path: 'createdBy',
    });

    if (comment.createdBy._id.toString() !== userId.toString()) {
      const notification = await Notification.create({
        to: comment.createdBy._id,
        type: 'comment',
        post: comment.post,
        space: spaceId,
        comment: comment._id,
        createdBy: userId,
        createdAt: new Date(),
      });

      const notificationData = {
        type: 'comment',
        postId: comment.post,
        commentId: comment._id,
      };

      if (comment.createdBy.pushToken) {
        console.log('token', comment.createdBy.pushToken);
        if (!Expo.isExpoPushToken(comment.createdBy.pushToken)) {
          console.error(`expo-push-token is not a valid Expo push token`);
        }
        const notifyMessage = {
          to: comment.createdBy.pushToken,
          sound: 'default',
          data: notificationData,
          title: `📨 ${userName} replied to your comment`,
          body: content,
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

export const getReplies = async (request, response) => {
  try {
    const { commentId } = request.params;
    const replies = await Reply.find({ comment: commentId }).populate({
      path: 'createdBy',
    });

    response.status(200).json({
      data: {
        replies,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
