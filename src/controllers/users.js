import SpaceAndUserRelationship from '../models/spaceAndUserRelationship';

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
      users,
    });
  } catch (error) {
    console.log(error);
  }
};
