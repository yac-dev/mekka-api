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
    // 基本、clientに返す形としては

    // みたいな感じのdata構造でユーザーに返す感じ。

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
    // {spaceId2: {tagId1: 2, tagId3: 4}, spaceId3: {tagId34: 4, tagId9: 3}}

    // [ {space: 1, updatedAt: 12/01, updatedBy: 'user1', tagId: 1},
    //   {space: 1, updatedAt: 12/01, updatedBy: 'user1', tagId: 4} ]
    console.log('res', res);
    const updateTable = {};
    spaceAndUserRelationships.forEach((relationship) => {
      updateTable[relationship.space._id] = {};
    });
    for (let i = 0; i < res.length; i++) {
      if (updateTable[res[i].space]) {
        // updateTable[res[i].space]++;
        // 何もしない感じか。。。
        if (updateTable[res[i].space][res[i].tag]) {
          updateTable[res[i].space][res[i].tag]++;
        } else {
          updateTable[res[i].space][res[i].tag] = 1;
        }
      } else {
        updateTable[res[i].space] = {};
        updateTable[res[i].space][res[i].tag] = 1;
        // if (updateTable[res[i].space][res[i].tag]) {
        //   updateTable[res[i].space][res[i].tag]++;
        // } else {
        //   updateTable[res[i].space][res[i].tag] = 1;
        // }
        // updateTable[res[i].space] = 1;
      }
    }
    console.log('updates', updateTable);
    // これを返す。
    // これを渡して、tagid propertyの合計値を無効で算出する。
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

export const updateSpaceLastCheckedIn = async (request, response) => {
  try {
    const spaceAndUserRelationship = await SpaceAndUserRelationship.findOne({
      user: request.params.userId,
      space: request.body.spaceId,
    });

    spaceAndUserRelationship.lastCheckedIn = new Date();
    spaceAndUserRelationship.save();

    console.log('now updated -> ', new Date());
    response.status(200).json({
      message: 'success', // 何も返す必要はないかな。
    });
  } catch (error) {
    console.log(error);
  }
};
