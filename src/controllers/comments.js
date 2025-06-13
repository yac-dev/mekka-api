import Reply from '../models/reply.js';
import Comment from '../models/comment.js';
import Post from '../models/post.js';
import Notification from '../models/notification.js';
import { Expo } from 'expo-server-sdk';
import mongoose from 'mongoose';
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
        comment: {
          _id: comment._id,
          content: comment.content,
          post: comment.post,
          createdBy: comment.createdBy,
          createdAt: comment.createdAt,
          replyCount: 0,
        },
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
    // const sortingCondition = { _id: -1 };

    const comments = await Comment.aggregate([
      {
        $match: {
          post: mongoose.Types.ObjectId(postId),
          createdBy: { $ne: null },
        },
      },
      {
        $lookup: {
          from: 'replies',
          localField: '_id',
          foreignField: 'comment',
          as: 'replies',
        },
      },
      {
        $addFields: {
          replyCount: { $size: '$replies' },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
              },
            },
            {
              $project: {
                _id: 1,
                email: 1,
                avatar: 1,
              },
            },
          ],
          as: 'createdBy',
        },
      },
      {
        $unwind: '$createdBy',
      },
      // {
      //   $sort: sortingCondition,
      // },
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

export const getReplies = async (request, response) => {
  try {
    const { commentId } = request.params;
    const replies = await Reply.find({ comment: commentId }).populate([
      {
        path: 'createdBy',
        select: '_id name avatar',
      },
      {
        path: 'to',
        select: '_id name avatar',
      },
    ]);

    response.status(200).json({
      data: {
        replies,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
