import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import SpaceUpdateLog from '../models/spaceUpdateLog.js';
import mongoose from 'mongoose';

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
    // ここのfilterも微妙だな。。。
    const spaceAndUserRelationships = documents.filter((relationship) => relationship.space !== null);
    const queryBySpace = spaceAndUserRelationships.map((rel) => {
      return {
        space: rel.space._id,
        lastCheckedIn: rel.lastCheckedIn,
      };
    });

    const res = [];
    const spaceUpdates = await SpaceUpdateLog.find({});
    for (let i = 0; i < spaceUpdates.length; i++) {
      for (let j = 0; j < queryBySpace.length; j++) {
        if (
          spaceUpdates[i].space.toString() === queryBySpace[j].space.toString() &&
          spaceUpdates[i].updatedAt > queryBySpace[j].lastCheckedIn
        ) {
          res.push(spaceUpdates[i]);
        }
      }
    }

    const updateTable = {};
    for (let i = 0; i < res.length; i++) {
      if (updateTable[res[i].space]) {
        updateTable[res[i].space]++;
      } else {
        updateTable[res[i].space] = 1;
      }
    }
    // これを返す。

    response.status(200).json({
      spaceAndUserRelationships,
      updateTable,
    });
  } catch (error) {
    console.log(error);
  }
};

// あのね、、、まずspaceAndUserRelを取ってくる
// {space: '1', lastCheckedIn: '2023/12/11'}, {space: '2', lastCheckedIn: '2023/12/13'}
// // 続いて、spaceUpdatesでは
// {
//   _id: new ObjectId("6587ef70a862860788842b00"),
//   space: '1',
//   updatedAt: 2023/12/12
// },
// {
//   _id: new ObjectId("6587f0b6a862860788842b04"),
//   space: '1'
//   updatedAt: 12/14
// },
// {
//   _id: new ObjectId("6587f12da862860788842b05"),
//   space: '2'
//   updatedAt: 2023/12/10
// }
