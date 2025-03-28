import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import SpaceUpdateLog from '../models/spaceUpdateLog.js';
import Tag from '../models/tag.js';
import mongoose from 'mongoose';

// ここで、同時にspaceごとのtagsを持ってきて、それぞれのspaceのtags property作って割り当てたいね。
export const getMySpaces = async (request, response) => {
  try {
    const documents = await SpaceAndUserRelationship.find({
      user: request.params.userId,
    }).populate({
      path: 'space',
      populate: [
        {
          path: 'reactions',
          select: '_id type emoji sticker caption',
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

    const spaceAndUserRelationships = documents.filter((relationship) => relationship.space !== null);
    const mySpaces = spaceAndUserRelationships.map((relationship) => relationship.space);
    const spaceIds = spaceAndUserRelationships.map((relationship) => relationship.space._id);
    const tagDocuments = await Tag.find({ space: { $in: spaceIds } }).populate({
      path: 'icon',
      model: 'Icon',
    });
    const tagsBySpaceId = {};

    for (const tag of tagDocuments) {
      const spaceId = tag.space.toString(); // Ensure the space ID is a string
      if (!tagsBySpaceId[spaceId]) {
        tagsBySpaceId[spaceId] = [];
      }
      tagsBySpaceId[spaceId].push(tag);
    }

    const newMySpaces = mySpaces.map((space) => {
      //NOTE const copied = {...space} //これだと、mongoの隠れたproperty福含め全部撮ってきちゃってる。。。面倒だ。。
      // ここ、ちょうどいい勉強材料になるな。。
      const plainSpaceObject = space.toObject();
      const spaceId = space._id.toString();
      plainSpaceObject.tags = tagsBySpaceId[spaceId] || [];
      return plainSpaceObject;
    });

    response.status(200).json({
      data: {
        mySpaces: newMySpaces,
        // updateTable,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateSpaceLastCheckedIn = async (request, response) => {
  try {
    const spaceAndUserRelationship = await SpaceAndUserRelationship.findOne({
      user: request.params.userId,
      space: request.body.spaceId,
    });

    spaceAndUserRelationship.lastCheckedIn = new Date();
    console.log('working??');
    spaceAndUserRelationship.save();

    response.status(200).json({
      message: 'success', // 何も返す必要はないかな。
    });
  } catch (error) {
    console.log(error);
  }
};
