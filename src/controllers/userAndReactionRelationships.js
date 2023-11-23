import UserAndReactionRelationship from '../models/userAndReactionRelationships.js';
import ReactionStatus from '../models/reactionStatus.js';
import Post from '../models/post.js';

export const createReaction = async (request, response) => {
  try {
    // どのpostにどのreactionを誰がしたかっていう話ね。
    // postにするってこと考えると、、、まあ、reactionを送る感じかな。
    const { userId, postId } = request.params;
    const { reactionId } = request.body;
    console.log(userId, postId);
    console.log(reactionId);

    const userAndReactionRelationship = await UserAndReactionRelationship.create({
      user: userId,
      post: postId,
      reaction: reactionId,
    });

    const reactionStatus = await ReactionStatus.findOne({ reaction: reactionId });
    reactionStatus.count++;
    reactionStatus.save();

    const post = await Post.findById(postId);
    post.totalReactions++;
    post.save();

    response.status(200).json({
      reactionStatus,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserReactions = async (request, response) => {
  try {
    const userAndReactionRelationships = await UserAndReactionRelationship.find({
      post: request.params.postId,
    }).populate([
      {
        path: 'user',
        model: 'User',
      },
      {
        path: 'reaction',
        model: 'Reaction',
        populate: {
          path: 'sticker',
          model: 'Sticker',
        },
      },
    ]);

    response.status(200).json({
      userAndReactionRelationships,
    });
  } catch (error) {
    console.log(error);
  }
};
