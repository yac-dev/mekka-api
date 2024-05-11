import Log from '../models/log.js';
import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';

function aggregateLogsBySpaceAndTag(logs) {
  const result = {};

  logs.forEach((log) => {
    const spaceId = log.space.toString(); // Ensure the ID is a string
    const tagId = log.tag.toString(); // Ensure the ID is a string

    // Initialize the space object if it doesn't exist
    if (!result[spaceId]) {
      result[spaceId] = {};
    }

    // Initialize the tag count if it doesn't exist
    if (!result[spaceId][tagId]) {
      result[spaceId][tagId] = 0;
    }

    // Increment the count for the tag
    result[spaceId][tagId]++;
  });

  return result;
}

export const getSpaceUpdates = async (request, response) => {
  try {
    const { userId } = request.params;
    const spaceAndUserRelationships = await SpaceAndUserRelationship.find({ user: userId });
    const spaceObjects = spaceAndUserRelationships.map((spaceAndUserRelationship) => {
      return {
        space: spaceAndUserRelationship.space,
        lastCheckedIn: spaceAndUserRelationship.lastCheckedIn,
      };
    });
    const queryConditions = spaceObjects.map(({ space, lastCheckedIn }) => ({
      space: space,
      createdBy: userId,
      createdAt: { $gt: lastCheckedIn },
    }));
    const logDocuments = await Log.find({ $or: queryConditions });

    const logs = aggregateLogsBySpaceAndTag(logDocuments);

    response.status(200).json({
      data: {
        logs,
      },
    });
  } catch (error) {
    throw error;
  }
};

// aggregate function動かないな。。。
// const logs = await Log.aggregate([
//   { $match: { $or: queryConditions } },
//   {
//     $group: {
//       _id: { space: '$space', tag: '$tag' },
//       count: { $sum: 1 },
//     },
//   },
//   {
//     $group: {
//       _id: '$_id.space',
//       tags: {
//         $push: {
//           tag: '$_id.tag',
//           count: '$count',
//         },
//       },
//     },
//   },
// ]);
