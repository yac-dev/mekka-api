import Comment from '../models/comment';
import Post from '../models/post';

export const createComment = async (request, response) => {
  try {
    const comment = await Comment.create({
      content: request.body.content,
      post: request.body.postId,
      createdBy: request.body.userId,
      createdAt: new Date(),
    });

    const post = await Post.find({ _id: request.body.postId });
    post.totalComments++;
    post.save();

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
