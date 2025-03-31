import FollowingRelationship from '../models/followingRelationship.js';

export const createFollowingRelationship = async (request, response) => {
  try {
    const { followerId, followeeId, spaceId } = request.body;
    const followingRelationship = await FollowingRelationship.create({
      follower: followerId,
      followee: followeeId,
      space: spaceId,
      createdAt: new Date(),
    });
    response.status(201).json({
      data: {
        followingRelationship,
      },
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// あるユーザーがfollowしているユーザーリストを返す。
export const getFollowingUsersByUserId = async (request, response) => {
  try {
    const { userId } = request.params;
    const followingRelationships = await FollowingRelationship.find({ follower: userId }).populate({
      path: 'followee',
      model: 'User',
    });

    const usersBySpace = followingRelationships.reduce((acc, followingRelationship) => {
      const spaceId = followingRelationship.space.toString();
      const followee = followingRelationship.followee;

      if (followee) {
        if (!acc[spaceId]) {
          acc[spaceId] = [];
        }
        acc[spaceId].push({
          _id: followee._id,
          name: followee.name,
          email: followee.email,
          avatar: followee.avatar,
        });
      }

      return acc;
    }, {});

    response.status(200).json({
      data: {
        followingUsers: usersBySpace,
      },
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteFollowingRelationship = async (request, response) => {
  try {
    const { followerId, followeeId, spaceId } = request.body;
    const followingRelationship = await FollowingRelationship.findOneAndDelete({
      follower: followerId,
      followee: followeeId,
      space: spaceId,
    });
    response.status(200).json({
      data: {
        followingRelationship,
      },
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
