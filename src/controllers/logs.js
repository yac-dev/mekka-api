import Log from '../models/log.js';
import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import Tag from '../models/tag.js';

function aggregateLogsBySpaceAndTag(logs) {
  const logsBySpaceAndTag = {};
  const momentLogsBySpaceAndTag = {};
  // これ、momentと普通のpostのlog別で分けようかね。
  logs.forEach((log) => {
    if (log.type === 'normal') {
      const spaceId = log.space.toString();
      const tagId = log.tag.toString();

      if (!logsBySpaceAndTag[spaceId]) {
        logsBySpaceAndTag[spaceId] = {};
      }

      if (!logsBySpaceAndTag[spaceId][tagId]) {
        logsBySpaceAndTag[spaceId][tagId] = 0;
      }

      logsBySpaceAndTag[spaceId][tagId]++;
    } else if (log.type === 'moment') {
      const spaceId = log.space.toString();

      if (!momentLogsBySpaceAndTag[spaceId]) {
        momentLogsBySpaceAndTag[spaceId] = 1;
      }

      momentLogsBySpaceAndTag[spaceId]++;
    }
  });

  return {
    logsBySpaceAndTag,
    momentLogsBySpaceAndTag,
  };
}

// export const getSpaceUpdates = async (request, response) => {
//   try {
//     const { userId } = request.params;
//     const spaceAndUserRelationships = await SpaceAndUserRelationship.find({ user: userId });
//     const spaceStates = spaceAndUserRelationships.map((spaceAndUserRelationship) => {
//       return {
//         space: spaceAndUserRelationship.space,
//         lastCheckedIn: spaceAndUserRelationship.lastCheckedIn,
//       };
//     });

//     let logs = {};
//     let momentLogs = {};
//     // 新しいユーザーなど、space何も入っていないユーザーの場合は, queryからになるから。
//     if (spaceStates.length) {
//       const queryConditions = spaceStates.map(({ space, lastCheckedIn }) => ({
//         space: space,
//         createdAt: { $gt: lastCheckedIn },
//       }));
//       const logDocuments = await Log.find({ $or: queryConditions });

//       const { logsBySpaceAndTag, momentLogsBySpaceAndTag } = aggregateLogsBySpaceAndTag(logDocuments);
//       logs = logsBySpaceAndTag;
//       momentLogs = momentLogsBySpaceAndTag;
//     }

//     // ここ、logがないのを持ってきてこれていないのよね。完全にこれが原因だわ。
//     console.log('logsこんな感じ', logs);

//     // とりあえず、postのlogとmomentのlogを分けることにした。
//     response.status(200).json({
//       data: {
//         logs,
//         momentLogs,
//       },
//     });
//   } catch (error) {
//     throw error;
//   }
// };

export const getSpaceUpdates = async (request, response) => {
  try {
    const { userId } = request.params;
    const spaceAndUserRelationships = await SpaceAndUserRelationship.find({ user: userId });
    const spaceStates = spaceAndUserRelationships.map((spaceAndUserRelationship) => {
      return {
        space: spaceAndUserRelationship.space,
        lastCheckedIn: spaceAndUserRelationship.lastCheckedIn,
      };
    });

    let logs = {};
    let momentLogs = {};
    if (spaceStates.length) {
      const queryConditions = spaceStates.map(({ space, lastCheckedIn }) => ({
        space: space,
        createdAt: { $gt: lastCheckedIn },
      }));
      const logDocuments = await Log.find({ $or: queryConditions });

      const { logsBySpaceAndTag, momentLogsBySpaceAndTag } = aggregateLogsBySpaceAndTag(logDocuments);

      // Initialize logs with all spaces and tags, setting default count to 0
      for (const { space } of spaceStates) {
        const spaceId = space.toString();
        if (!logs[spaceId]) {
          logs[spaceId] = {};
        }
        const tags = await Tag.find({ space: spaceId });
        for (const tag of tags) {
          const tagId = tag._id.toString();
          if (!logs[spaceId][tagId]) {
            logs[spaceId][tagId] = 0;
          }
        }
      }

      // Merge actual log counts into the initialized logs
      for (const spaceId in logsBySpaceAndTag) {
        for (const tagId in logsBySpaceAndTag[spaceId]) {
          logs[spaceId][tagId] = logsBySpaceAndTag[spaceId][tagId];
        }
      }

      momentLogs = momentLogsBySpaceAndTag;
    }
    console.log('logsこんな感じ', logs);

    response.status(200).json({
      data: {
        logs,
        momentLogs,
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
