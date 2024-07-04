import { PostAndReactionAndUserRelationship } from '../models/postAndReactionAndUserRelationship.js';

export const getReactionsByPostId = async (request, response) => {
  try {
    const { postId } = request.params;
    const reactions = await PostAndReactionAndUserRelationship.aggregate([
      { $match: { post: postId } },
      {
        $group: {
          _id: '$reaction',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'reactions',
          localField: '_id',
          foreignField: '_id',
          as: 'reactionDetails',
        },
      },
      { $unwind: '$reactionDetails' },
      {
        $project: {
          _id: 0,
          reaction: {
            _id: '$reactionDetails._id',
            type: '$reactionDetails.type',
            // Add other fields from the reaction model as needed
            count: '$count',
          },
        },
      },
    ]);

    response.status(200).json({
      data: reactions,
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
