import SpaceAndUserRelationship from '../models/spaceAndUserRelationship';
import Reaction from '../models/reaction';

export const getMySpaces = async (request, response) => {
  try {
    const documents = await SpaceAndUserRelationship.find({
      user: request.params.userId,
    }).populate({
      path: 'space',
      populate: [
        {
          path: 'reactions',
          select: '_id type emoji sticker',
          model: 'Reaction',
          populate: {
            path: 'sticker',
            model: 'Sticker',
          },
        },
        {
          path: 'createdBy',
          select: '_id name avatar',
        },
      ],
    });

    // console.log(JSON.stringify(documents, null, 4));

    const spaceAndUserRelationships = documents.filter((relationship) => relationship.space !== null);
    response.status(200).json({
      spaceAndUserRelationships,
    });
  } catch (error) {
    console.log(error);
  }
};
