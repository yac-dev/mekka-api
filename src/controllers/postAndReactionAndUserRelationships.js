import { PostAndReactionAndUserRelationship } from '../models/postAndReactionAndUserRelationship.js';
import mongoose from 'mongoose';

// このaggregation pipelineをうまく使えるようになりたいわな。。。
// aggregationでは、
// ok　落ち着け。ここでやりたいのはシンプルに、postIdを使ってまずreactionをとってくることね。
export const getReactionsByPostId = async (request, response) => {
  try {
    // postのid使って、reactionのcountを取ってくきたいんだよな。。。
    const { postId } = request.params;
    const reactions = await PostAndReactionAndUserRelationship.aggregate([
      // aggregation pipelineでは、match stageでid比較したお場合は、monggose objectIdに変換せんといかんらしい。
      { $match: { post: new mongoose.Types.ObjectId(postId) } },
      // aggragation pipelineのgroupでは, _id nullだと全てをdocumentをcountするっぽい。
      // {
      //   $group: {
      //     _id: '$reaction',
      //     count: { $sum: 1 },
      //   },
      // },
      // // 上のarrayをさらにaggregationする。
      // {
      //   $lookup: {
      //     from: 'reactions',
      //     localField: '_id', //上でaggregationして得たのがlocalでそれをjoinしていく。それをreactionsという名前でoutputする。
      //     foreignField: '_id',
      //     as: 'reactionDetails',
      //   },
      // },
      // // 上の結果arrayをdestructureしていく。
      // { $unwind: '$reactionDetails' },
      // {
      //   $lookup: {
      //     from: 'stickers',
      //     localField: 'reactionDetails.sticker',
      //     foreignField: '_id',
      //     as: 'stickerDetails',
      //   },
      // },
      // {
      //   $unwind: {
      //     path: '$stickerDetails',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $project: {
      //     // _id: 0,
      //     _id: '$reactionDetails._id',
      //     type: '$reactionDetails.type',
      //     emoji: '$reactionDetails.emoji',
      //     sticker: '$stickerDetails',
      //     caption: '$reactionDetails.caption',
      //     count: '$count',
      //   },
      // },
    ]);

    // const reactions = await PostAndReactionAndUserRelationship.find({ post: postId });

    response.status(200).json({
      data: {
        reactions,
      },
    });
  } catch (error) {
    response.status(500).json({
      error: error.message,
    });
  }
};

export const createReaction = async (request, response) => {
  try {
    const { postId, reactionId, userId } = request.body;
    const reaction = await PostAndReactionAndUserRelationship.create({
      post: postId,
      reaction: reactionId,
      user: userId,
    });

    console.log('created', reaction);
    response.status(201).json({
      data: {
        reaction,
      },
    });
  } catch (error) {
    response.status(500).json({
      error: error.message,
    });
  }
};
