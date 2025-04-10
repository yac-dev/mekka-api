import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import User from '../models/user.js';
import Notification from '../models/notification.js';
import mongoose from 'mongoose';

export const getUsersBySpaceId = async (request, response) => {
  try {
    const { spaceId } = request.params;
    const spaceAndUserRelationships = await SpaceAndUserRelationship.find({ space: spaceId }).populate({
      path: 'user',
      select: '_id name avatar',
    });
    console.log(spaceAndUserRelationships);
    const users = spaceAndUserRelationships
      .filter((relationship) => relationship.user !== null) // filterって!relationship.userではだめなのか。条件式でないとダメなのか。
      .map((relationship) => {
        return relationship.user;
      });

    console.log(users);

    response.status(200).json({
      data: {
        users,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserById = async (request, response) => {
  try {
    const { userId } = request.params;
    const user = await User.findById(userId);
    response.status(200).json({
      data: {
        user,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUsersByAddress = async (request, response) => {
  try {
    const users = await User.find();
    const mapped = users.map((user) => {
      return user.addresss;
    });

    response.status(200).json({ data: { users: mapped } });
  } catch (error) {
    console.log(error);
  }
};

// export const getSpacesByUserId = async (request, response) => {
//   try {
//     // ここら辺とか、完全にaggregationでできるよね。自分でチャレンジしてみよう。
//     const documents = await SpaceAndUserRelationship.find({
//       user: request.params.userId,
//     }).populate({
//       path: 'space',
//       populate: [
//         {
//           path: 'reactions',
//           select: '_id type emoji sticker caption',
//           model: 'Reaction',
//           populate: {
//             path: 'sticker',
//             model: 'Sticker',
//           },
//         },
//         {
//           path: 'createdBy',
//           select: '_id name avatar',
//         },
//       ],
//     });

//     const spaceAndUserRelationships = documents.filter((relationship) => relationship.space !== null);
//     const mySpaces = spaceAndUserRelationships.map((relationship) => relationship.space);
//     const spaceIds = spaceAndUserRelationships.map((relationship) => relationship.space._id);
//     const tagDocuments = await Tag.find({ space: { $in: spaceIds } }).populate({
//       path: 'icon',
//       model: 'Icon',
//     });
//     const tagsBySpaceId = {};

//     for (const tag of tagDocuments) {
//       const spaceId = tag.space.toString(); // Ensure the space ID is a string
//       if (!tagsBySpaceId[spaceId]) {
//         tagsBySpaceId[spaceId] = [];
//       }
//       tagsBySpaceId[spaceId].push(tag);
//     }

//     const newMySpaces = mySpaces.map((space) => {
//       //NOTE const copied = {...space} //これだと、mongoの隠れたproperty福含め全部撮ってきちゃってる。。。面倒だ。。
//       // ここ、ちょうどいい勉強材料になるな。。
//       const plainSpaceObject = space.toObject();
//       const spaceId = space._id.toString();
//       plainSpaceObject.tags = tagsBySpaceId[spaceId] || [];
//       return plainSpaceObject;
//     });

//     response.status(200).json({
//       data: {
//         mySpaces: newMySpaces,
//         // updateTable,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

export const getSpacesByUserId = async (request, response) => {
  try {
    const spaces = await SpaceAndUserRelationship.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(request.params.userId) } },
      {
        $lookup: {
          from: 'spaces',
          localField: 'space',
          foreignField: '_id',
          as: 'spaceDetail',
        },
      },
      { $unwind: '$spaceDetail' },
      {
        $lookup: {
          from: 'reactions',
          localField: 'spaceDetail.reactions',
          foreignField: '_id',
          as: 'reactions',
        },
      },
      {
        $lookup: {
          from: 'stickers',
          localField: 'reactions.sticker',
          foreignField: '_id',
          as: 'stickerDetail',
        },
      },
      {
        $lookup: {
          from: 'tags',
          localField: 'spaceDetail._id',
          foreignField: 'space',
          as: 'tags',
        },
      },
      {
        $lookup: {
          from: 'icons',
          localField: 'tags.icon',
          foreignField: '_id',
          as: 'iconDetail',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'spaceDetail.createdBy',
          foreignField: '_id',
          as: 'createdByDetail',
        },
      },
      { $unwind: '$createdByDetail' },
      {
        $lookup: {
          from: 'spaceanduserrelationships',
          localField: 'spaceDetail._id',
          foreignField: 'space',
          as: 'userDetails',
        },
      },
      {
        $addFields: {
          reactions: {
            $map: {
              input: '$reactions',
              as: 'reaction',
              in: {
                $mergeObjects: [
                  '$$reaction',
                  {
                    sticker: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$stickerDetail',
                            as: 'sticker',
                            cond: { $eq: ['$$sticker._id', '$$reaction.sticker'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
          tags: {
            $map: {
              input: '$tags',
              as: 'tag',
              in: {
                $mergeObjects: [
                  '$$tag',
                  {
                    icon: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$iconDetail',
                            as: 'icon',
                            cond: { $eq: ['$$icon._id', '$$tag.icon'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: '$spaceDetail._id',
          name: '$spaceDetail.name',
          icon: '$spaceDetail.icon',
          contentType: '$spaceDetail.contentType',
          isPublic: '$spaceDetail.isPublic',
          isCommentAvailable: '$spaceDetail.isCommentAvailable',
          isReactionAvailable: '$spaceDetail.isReactionAvailable',
          disappearAfter: '$spaceDetail.disappearAfter',
          description: '$spaceDetail.description',
          videoLength: '$spaceDetail.videoLength',
          secretKey: '$spaceDetail.secretKey',
          isFollowAvailable: '$spaceDetail.isFollowAvailable',
          isPublic: '$spaceDetail.isPublic',
          reactions: 1,
          tags: 1,
          createdBy: {
            _id: '$createdByDetail._id',
            name: '$createdByDetail.name',
            email: '$createdByDetail.email',
            avatar: '$createdByDetail.avatar',
          },
          totalMembers: { $size: '$userDetails' },
          createdAt: '$spaceDetail.createdAt',
          lastCheckedIn: '$lastCheckedIn',
        },
      },
    ]);

    response.status(200).json({
      data: {
        spaces,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

// これ、、、loadmeでいけるのかなーーー。。。
// ここもpaginationを実装したいよな。。。数は出して、ベルマーク押したらもう全部readにするようpatch requestを送る感じにするか。
// 開いたら、みんなreadにpatchすればいっか。
// bellマークにバッジはつけておいて、開いたらバッジは消す、帰ってきたら、patchかな。。。？それかもう開いた時点で全部readにしてしまうか。。。
// export const getNotificationsByUserId = async (request, response) => {
//   try {
//     const { userId } = request.params;
//     const notifications = await Notification.aggregate([
//       { $match: { to: new mongoose.Types.ObjectId(userId), isRead: false } },
//       {
//         $lookup: {
//           from: 'spaces',
//           localField: 'space',
//           foreignField: '_id',
//           as: 'spaceDetail',
//         },
//       },
//       { $unwind: '$spaceDetail' },
//       {
//         $lookup: {
//           from: 'posts',
//           localField: 'post',
//           foreignField: '_id',
//           as: 'postDetail',
//         },
//       },
//       { $unwind: '$postDetail' },
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'createdBy',
//           foreignField: '_id',
//           as: 'createdByDetail',
//         },
//       },
//       { $unwind: '$createdByDetail' },
//       {
//         $lookup: {
//           from: 'comments',
//           let: { commentId: '$comment' },
//           pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$commentId'] } } }, { $limit: 1 }],
//           as: 'commentDetail',
//         },
//       },
//       {
//         $lookup: {
//           from: 'reactions',
//           let: { reactionId: '$reaction' },
//           pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$reactionId'] } } }, { $limit: 1 }],
//           as: 'reactionDetail',
//         },
//       },
//       {
//   $lookup: {
//     from: 'users',
//     localField: 'postDetail.createdBy',
//     foreignField: '_id',
//     as: 'postCreatedByDetail',
//   },
// },
// { $unwind: '$postCreatedByDetail' },
//       {
//         $lookup: {
//           from: 'contents',
//           localField: 'postDetail.contents',
//           foreignField: '_id',
//           as: 'contentDetail',
//         },
//       },
//       { $unwind: '$contentDetail' },
//       {
//         $addFields: {
//           commentDetail: { $arrayElemAt: ['$commentDetail', 0] },
//           reactionDetail: { $arrayElemAt: ['$reactionDetail', 0] },
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           type: 1,
//           createdAt: 1,
//           createdBy: {
//             _id: '$createdByDetail._id',
//             name: '$createdByDetail.name',
//             email: '$createdByDetail.email',
//             avatar: '$createdByDetail.avatar',
//           },
//           space: {
//             _id: '$spaceDetail._id',
//             name: '$spaceDetail.name',
//             icon: '$spaceDetail.icon',
//           },
//           post: {
//             _id: '$postDetail._id',
//             contents: '$contentDetail',
//             createdBy: '$postCreatedByDetail',
//             createdAt: '$postDetail.createdAt',
//           },
//           comment: '$commentDetail',
//           reaction: '$reactionDetail',
//           isRead: 1,
//         },
//       },
//     ]);
//     response.status(200).json({
//       data: {
//         notifications,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

export const getNotificationsByUserId = async (request, response) => {
  try {
    const { userId } = request.params;
    const page = Number(request.query.page);
    let hasNextPage = true;
    const limitPerPage = 20;
    const sortingCondition = { _id: -1 };

    const notifications = await Notification.aggregate([
      { $match: { to: new mongoose.Types.ObjectId(userId) } },
      { $sort: sortingCondition },
      { $skip: page * limitPerPage },
      { $limit: limitPerPage },
      {
        $lookup: {
          from: 'spaces',
          localField: 'space',
          foreignField: '_id',
          as: 'spaceDetail',
        },
      },
      { $unwind: '$spaceDetail' },
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postDetail',
        },
      },
      { $unwind: '$postDetail' },
      {
        $lookup: {
          from: 'users',
          localField: 'postDetail.createdBy',
          foreignField: '_id',
          as: 'postCreatedByDetail',
        },
      },
      { $unwind: '$postCreatedByDetail' },
      {
        $lookup: {
          from: 'contents',
          localField: 'postDetail.contents',
          foreignField: '_id',
          as: 'contentDetail',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByDetail',
        },
      },
      { $unwind: '$createdByDetail' },
      {
        $lookup: {
          from: 'comments',
          let: { commentId: '$comment' },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$commentId'] } } }, { $limit: 1 }],
          as: 'commentDetail',
        },
      },
      {
        $lookup: {
          from: 'reactions',
          let: { reactionId: '$reaction' },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$reactionId'] } } }, { $limit: 1 }],
          as: 'reactionDetail',
        },
      },
      {
        $lookup: {
          from: 'stickers',
          localField: 'reactionDetail.sticker',
          foreignField: '_id',
          as: 'stickerDetail',
        },
      },
      {
        $addFields: {
          commentDetail: { $arrayElemAt: ['$commentDetail', 0] },
          reactionDetail: {
            $let: {
              vars: {
                reaction: { $arrayElemAt: ['$reactionDetail', 0] },
                sticker: { $arrayElemAt: ['$stickerDetail', 0] },
              },
              in: {
                $cond: {
                  if: { $eq: ['$$reaction.type', 'sticker'] },
                  then: { $mergeObjects: ['$$reaction', { sticker: '$$sticker' }] },
                  else: '$$reaction',
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          createdAt: 1,
          createdBy: {
            _id: '$createdByDetail._id',
            name: '$createdByDetail.name',
            email: '$createdByDetail.email',
            avatar: '$createdByDetail.avatar',
          },
          space: {
            _id: '$spaceDetail._id',
            name: '$spaceDetail.name',
            icon: '$spaceDetail.icon',
          },
          post: {
            _id: '$postDetail._id',
            contents: '$contentDetail',
            type: '$postDetail.type',
            caption: '$postDetail.caption',
            space: '$postDetail.space',
            location: '$postDetail.location',
            disappearAt: '$postDetail.disappearAt',
            createdBy: '$postCreatedByDetail',
            createdAt: '$postDetail.createdAt',
          },
          comment: '$commentDetail',
          reaction: '$reactionDetail',
          isRead: 1,
        },
      },
    ]);

    if (!notifications.length) hasNextPage = false;

    response.status(200).json({
      data: {
        notifications,
        currentPage: page + 1,
        hasNextPage,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const readNotifications = async (request, response) => {
  try {
    const { userId } = request.params;
    await Notification.updateMany({ to: userId, isRead: false }, { $set: { isRead: true } });
    response.status(200).json({
      data: {},
    });
  } catch (error) {
    console.log(error);
  }
};
