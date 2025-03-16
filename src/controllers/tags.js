import PostAndTagRelationship from '../models/postAndTagRelationship.js';

export const getPostsByTagId = async (request, response) => {
  try {
    const page = Number(request.query.page);
    let hasNextPage = true;
    const limitPerPage = 30;
    const sortingCondition = { _id: -1 };
    const postAndTagRelationships = await PostAndTagRelationship.find({
      tag: request.params.tagId,
    })
      .sort(sortingCondition)
      .skip(page * limitPerPage)
      .limit(limitPerPage)
      .populate({
        path: 'post',
        model: 'Post',
        select: '_id contents type createdAt createdBy caption location disappearAt totalComments totalReactions',
        populate: [
          {
            path: 'contents',
            model: 'Content',
          },
          { path: 'createdBy', model: 'User', select: '_id name avatar' },
          { path: 'space', model: 'Space', select: 'reactions' },
        ],
      });

    const posts = await Promise.all(
      postAndTagRelationships
        .filter((relationship) => relationship.post !== null && relationship.post.createdBy !== null)
        .map(async (relationship) => {
          if (relationship.post.type === 'normal') {
            // const totalComments = await Comment.countDocuments({ post: relationship.post._id });
            // // const totalReactions = await ReactionStatus.countDocuments({ post: relationship.post._id });
            // const totalReactions = await PostAndReactionAndUserRelationship.countDocuments({
            //   post: relationship.post._id,
            // });
            // そっかここでやってんのか。。。totalCommentsとか。。。。totalのcomment, totaleReactions取っているから遅くなるんだよな。。。
            return {
              _id: relationship.post._id,
              contents: relationship.post.contents,
              type: relationship.post.type,
              caption: relationship.post.caption,
              createdAt: relationship.post.createdAt,
              createdBy: relationship.post.createdBy,
              disappearAt: relationship.post.disappearAt,
              // space: relationship.post.space,
              // totalComments,
              // totalReactions,
              location: relationship.post.location,
            };
          }
        })
    );

    const filteredPosts = posts.filter((post) => post);

    if (!posts.length) hasNextPage = false;
    response.status(200).json({
      data: {
        posts: filteredPosts,
        currentPage: page + 1,
        hasNextPage,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
