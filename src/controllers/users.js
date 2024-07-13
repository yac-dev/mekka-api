import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import User from '../models/user.js';

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
