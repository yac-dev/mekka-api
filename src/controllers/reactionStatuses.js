import ReactionStatus from '../models/reactionStatus.js';

// ここ、後でtestしないとね。色々手動で消して。
export const getReactionStatuses = async (request, response) => {
  try {
    const reactionStatuses = await ReactionStatus.find({
      post: request.params.postId,
      reaction: { $ne: null },
      // 'reaction.sticker': { $ne: null },
    }).populate({
      path: 'reaction',
      model: 'Reaction',
      populate: {
        path: 'sticker',
        model: 'Sticker',
      },
    });

    response.status(200).json({
      reactionStatuses,
    });
  } catch (error) {
    console.log(error);
  }
};
