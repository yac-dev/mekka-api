import FollowingRelationship from '../models/followingRelationship.js';

export const createFollowingRelationship = async (request, response) => {
  try {
    const { follower, followee, spaceId } = request.body;
    const followingRelationship = await FollowingRelationship.create({ follower, followee, spaceId });
    response.status(201).json({
      data: {
        follower,
        followee,
        spaceId,
      },
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getFollowingRelationship = async (request, response) => {
  try {
    const followingRelationship = await FollowingRelationship.find({});
    response.status(200).json({
      success: true,
      followingRelationship,
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
