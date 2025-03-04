import Space from '../models/space.js';
import Post from '../models/post.js';
import Content from '../models/content.js';
import ReactionStatus from '../models/reactionStatus.js';
import Comment from '../models/comment.js';
import Tag from '../models/tag.js';
import LocationTag from '../models/locationTag.js';
import PostAndTagRelationship from '../models/postAndTagRelationship.js';
import SpaceUpdateLog from '../models/spaceUpdateLog.js';
import TagUpdateLog from '../models/tagUpdateLog.js';
import { uploadPhoto, uploadVideo } from '../services/s3.js';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import util from 'util';
import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import { exec } from 'child_process';
// const ffmpeg = require('fluent-ffmpeg');
import ffmpeg from 'fluent-ffmpeg';
import { Expo } from 'expo-server-sdk';
import mongoose from 'mongoose';
import Moment from '../models/moment.js';
import Log from '../models/log.js';
const expo = new Expo();
const unlinkFile = util.promisify(fs.unlink);

const getFilePath = (fileName) => {
  return path.join(path.resolve(), 'buffer', fileName);
};

const removeFile = async (fileName) => {
  const filePath = getFilePath(fileName);
  await unlinkFile(filePath);
};

const optimizeImage = async (inputFileName, resolution, fit = 'contain') => {
  const fileInput = getFilePath(inputFileName);
  const processed = await sharp(fileInput)
    .rotate()
    .resize({ height: resolution.height, width: resolution.width, fit })
    .withMetadata()
    .webp({ quality: 1 })

    .toBuffer();
  return processed;
};

const optimizeVideoNew = (fileName) => {
  const optimizedVideoFileName = `${fileName.split('.')[0]}-optimized.mp4`;
  const thumbnailFileName = `${fileName.split('.')[0]}_thumbnail.webp`;
  const originalVideoPath = getFilePath(fileName);
  const optimizedVideoPath = getFilePath(optimizedVideoFileName);
  const thumbnailPath = getFilePath(thumbnailFileName);

  // 元々使ってたやつ
  // const command = `ffmpeg -i ${inputFilePath} -vcodec h264 -b:v:v 1500k -acodec mp3 ${outputFilePath} -ss 00:00:01 -vframes 1 ${thumbnailPath}`;

  // const command = `ffmpeg -i ${fileObject.path} -vcodec h264 -b:v:v 2000k -acodec mp3 ${outputFilePath}`;
  // const command = `ffmpeg -i ${fileObject.path} -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 64k ${outputFilePath} -ss 00:00:01 -vframes 1 ${thumbnailPath}`;
  // const command = `ffmpeg -i ${fileObject.path} -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf 23 -preset slower -c:a aac -b:a 128k -movflags +faststart ${outputFilePath} -ss 00:00:01 -vframes 1 ${thumbnailPath}`;

  // if statement使いたいけど、、動かん。。。
  // const command = `ffmpeg -i ${fileObject.path} -vf "scale='if(gte(iw,ih),960:540,540:960)':force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf 23 -preset slower -c:a aac -b:a 128k -movflags +faststart ${outputFilePath} -ss 00:00:01 -vframes 1 ${thumbnailPath}`;

  // const command = `ffmpeg -i ${originalVideoPath} -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf 20 -preset slower -c:a aac -b:a 128k -movflags +faststart ${optimizedVideoPath} -ss 00:00:01 -vframes 1 ${thumbnailPath}`;

  const command = `ffmpeg -i ${originalVideoPath} ${optimizedVideoPath} -ss 00:00:01 -vframes 1 ${thumbnailPath}`;

  return new Promise((resolve) => {
    exec(command, (err) => {
      if (err) console.log('Error ', err);
      else {
        resolve({
          optimizedVideoFileName,
          thumbnailFileName,
        });
      }
    });
  });
};
// あとは、いままで保存された写真なりビデオのurlを変えないといかんのよね。こういう場合ってどうするんだろう。

const processImage = async (fileName, resolution) => {
  // 1 imageを圧縮、
  const imageBinary = await optimizeImage(fileName, resolution);
  // 2 そのimageをs3にuploadする。
  await uploadContentToS3(fileName, 'photos', imageBinary);
  // 3 そのimageをunlinkする。
  await removeFile(fileName);
};

export const processVideo = async (originalFileName, thumbnailResolution) => {
  // 1 video圧縮 + thumbnail作成。
  const { thumbnailFileName, optimizedVideoFileName } = await optimizeVideoNew(originalFileName);
  const videoBinary = fs.createReadStream(getFilePath(optimizedVideoFileName));
  const thumbnailBinary = await optimizeImage(thumbnailFileName, thumbnailResolution, 'cover');
  // 2 そのvideoとthumbnailをs3にuploadする。
  await uploadContentToS3(originalFileName, 'videos', videoBinary);
  await uploadContentToS3(thumbnailFileName, 'photos', thumbnailBinary);

  // 3 そのvideoとthumbnailをunlinkする。
  await removeFile(originalFileName);
  await removeFile(optimizedVideoFileName);
  await removeFile(thumbnailFileName);
};

const processContent = async (contentObject) => {
  const contentFolder = contentObject.type === 'photo' ? 'photos' : 'videos';
  const thumbnailFileName = `${contentObject.fileName.split('.')[0]}_thumbnail.webp`;

  const content = await Content.create({
    data: `${process.env.CLOUDFRONT_URL}${contentFolder}/${contentObject.fileName}`,
    type: contentObject.type,
    duration: contentObject.duration,
    createdBy: contentObject.userId,
    thumbnail: contentObject.type === 'video' ? `${process.env.CLOUDFRONT_URL}photos/${thumbnailFileName}` : null,
  });

  if (contentObject.type === 'photo') {
    await processImage(contentObject.fileName, { height: 1920, width: 1080 });
    return content;
  } else if (contentObject.type === 'video') {
    await processVideo(contentObject.fileName, { height: 1000, width: 1000 });
    return content;
  }
};

// export const createMoment = async (request, response) => {
//   try {
//     // postで、reactionを全部持っておかないとね。
//     const {
//       caption,
//       createdBy,
//       spaceId,
//       reactions,
//       addedTags,
//       createdTags,
//       createdLocationTag,
//       addedLocationTag,
//       contents,
//       type,
//       disappearAfter,
//       location,
//     } = request.body;
//     // 現在の時間にdissaperAfter(minute)を足した日時を出す。
//     // const parsedLocation = JSON.parse(location);
//     const createdAt = new Date();
//     const disappearAt = new Date(createdAt.getTime() + Number(disappearAfter) * 60 * 1000);
//     const parsedReactions = JSON.parse(reactions);
//     const parsedTags = JSON.parse(addedTags);
//     const parsedCreatedTags = JSON.parse(createdTags);
//     const parsedLocation = JSON.parse(location);
//     // const parsedLocationTag = JSON.parse(addedLocationTag);
//     const files = request.files;
//     const contentIds = [];
//     let parsedCreatedLocationTag;
//     // if (createdLocationTag) {
//     //   parsedCreatedLocationTag = JSON.parse(createdLocationTag);
//     // }
//     // let parsedAddedLocationTag;
//     // if (addedLocationTag) {
//     //   parsedAddedLocationTag = JSON.parse(addedLocationTag);
//     // }
//     console.log('request body from  ', request.body);

//     // console.log(parsedCreatedLocationTag);
//     // console.log(parsedAddedLocationTag);
//     // console.log(request);

//     // まあ、一応動く。ただ、icon upload部分の動きも変わっちゃっている。そこを直さないといいかん。
//     const contentPromises = JSON.parse(contents).map(async (contentObject) => {
//       let fileName;
//       if (contentObject.type === 'photo') {
//         fileName = `${contentObject.fileName.split('.')[0]}.webp`;
//       } else if (contentObject.type === 'video') {
//         // --- ver1 ffmpeg通す時のやつ
//         // fileName = `optimized-${contentObject.fileName.split('.')[0]}.mp4`;
//         // -----
//         fileName = `${contentObject.fileName.split('.')[0]}.mp4`;
//       }
//       const content = await Content.create({
//         data: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/${
//           contentObject.type === 'photo' ? 'photos' : 'videos'
//         }/${fileName}`,
//         type: contentObject.type,
//         duration: contentObject.duration,
//         createdBy,
//         createdAt,
//       });
//       contentIds.push(content._id);
//       // // ここでsharpしてoutputする必要があって、そのoutputをawsにあげるっていう流れだよな。
//       // await uploadPhoto(content.fileName, content.type);
//       // return content;
//       // ここで場合わけをするか。photoかvideoか。
//       if (contentObject.type === 'photo') {
//         const sharpedImageBinary = await sharpImage(contentObject.fileName);
//         await uploadPhoto(contentObject.fileName, fileName, content.type, sharpedImageBinary);
//         return content;
//       } else if (contentObject.type === 'video') {
//         // --- ver1
//         // ffmpegを通して、
//         const outputFileName = `optimized-${contentObject.fileName}`;
//         const optimizedVideoFilePath = await optimizeVideo(contentObject.fileName, outputFileName);
//         const fileStream = fs.createReadStream(optimizedVideoFilePath);
//         // awsにuploadする。
//         await uploadPhoto(contentObject.fileName, fileName, content.type, fileStream);
//         await unlinkFile(optimizedVideoFilePath);
//         return content;
//         // ---

//         // ver2
//         // await uploadVideo(contentObject.fileName);
//         // return content;
//       }
//     });

//     // 1 contentsを作る。
//     // batch creation
//     // そっか、これあれだわな。。。fileで作っちゃっているからdurationをつけようがないよな。。
//     // -----------------
//     // const contentPromises = files.map(async (file) => {
//     //   const content = await Content.create({
//     //     data: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/${
//     //       file.mimetype === 'image/jpeg' ? 'photos' : 'videos'
//     //     }/${file.filename}`,
//     //     type: file.mimetype === 'image/jpeg' ? 'photo' : 'video',
//     //     duration: file.mimetype === 'image/jpeg' ? null : duration,
//     //     createdBy,
//     //     createdAt,
//     //   });
//     //   contentIds.push(content._id);
//     //   await uploadPhoto(file.filename, content.type);
//     //   return content;
//     // });
//     const contentDocuments = await Promise.all(contentPromises);

//     // // 2,postを作る
//     // let locationTag;
//     // if (createdLocationTag) {
//     //   locationTag = await LocationTag.create({
//     //     iconType: parsedCreatedLocationTag.iconType,
//     //     icon: parsedCreatedLocationTag.icon,
//     //     image: parsedCreatedLocationTag.image,
//     //     name: parsedCreatedLocationTag.name,
//     //     point: parsedCreatedLocationTag.point,
//     //     color: parsedCreatedLocationTag.color,
//     //     space: spaceId,
//     //     createdBy: createdBy,
//     //   });
//     // }

//     // let addingLocationTag;
//     // if (createdLocationTag) {
//     //   addingLocationTag = createdLocationTag;
//     // } else if (addedLocationTag) {
//     //   addingLocationTag = addedLocationTag;
//     // } else {
//     //   addingLocationTag = null;
//     // }

//     // console.log(addingLocationTag);

//     const moment = await Moment.create({
//       contents: contentIds,
//       type,
//       caption,
//       space: spaceId,
//       // locationTag: addingLocationTag ? addingLocationTag._id : null,
//       location: parsedLocation,
//       disappearAt: type === 'moment' ? disappearAt : null,
//       createdBy,
//       createdAt,
//     });

//     // 3 reactionのstatusを作る。
//     const reacionStatusObjects = parsedReactions.map((reactionId) => {
//       return {
//         post: post._id,
//         reaction: reactionId,
//         count: 0,
//       };
//     });
//     const reactionAndStatuses = await ReactionStatus.insertMany(reacionStatusObjects);

//     const tagIds = [];

//     // 4 新しいtagを作る、もし、createdTagsがあったら。
//     // ここは、多分tagの_idでやるべきだよね。。。
//     // nameがhashのiconを見つけて、その_idを埋め込む必要がある。。。
//     let createdTagDocuments;
//     let tagObjects;
//     // client側でもうhashTagを持っておこうか。。。
//     if (parsedCreatedTags.length) {
//       tagObjects = parsedCreatedTags.map((tag) => {
//         return {
//           _id: new mongoose.Types.ObjectId(),
//           iconType: tag.iconType,
//           icon: tag.icon,
//           color: tag.color,
//           image: tag.image,
//           name: tag.name,
//           count: 1,
//           space: spaceId,
//           createdBy: createdBy,
//           updatedAt: new Date(),
//         };
//       });

//       const inserting = tagObjects.map((tagObject) => {
//         return {
//           _id: tagObject._id,
//           iconType: tagObject.iconType,
//           icon: tagObject.icon._id,
//           color: tagObject.color,
//           image: tagObject.image,
//           name: tagObject.name,
//           count: 1,
//           space: spaceId,
//           createdBy: createdBy,
//           updatedAt: new Date(),
//         };
//       });
//       // iconを、url付きで返したいのよ。
//       createdTagDocuments = await Tag.insertMany(inserting);
//       createdTagDocuments.forEach((tagDocument) => {
//         tagIds.push(tagDocument._id);
//       });
//     }

//     let addedExistingTags;
//     // だから、client側ではtagのidだけを入れておく感じな。
//     if (parsedTags.length) {
//       // parsedTags
//       const tags = await Tag.find({ _id: { $in: parsedTags } });
//       const updatePromises = tags.map((tag) => {
//         tag.count += 1;
//         tag.updatedAt = new Date();
//         return tag.save();
//       });

//       // Execute all update promises in parallel
//       await Promise.all(updatePromises);
//       tagIds.push(...parsedTags);
//       // parsedTags.forEach((tagId) => {
//       //   tagIds.push(tagId);
//       // });
//     }

//     // tagIdsをもとにpostAndTagのrelationshipを作る、もちろん最終的にtagIdsのlengthがあったらね。
//     // 最終的に、つけられたtagとpostのrelationshipを作る。
//     if (tagIds.length) {
//       const postAndTagRelationshipObjects = tagIds.map((tagId) => {
//         return {
//           post: post._id,
//           tag: tagId,
//         };
//       });

//       const postAndTagRelationshipDocuments = await PostAndTagRelationship.insertMany(postAndTagRelationshipObjects);
//     }
//     // spaceのupdateLogを作る。
//     const spaceUpdateLog = await SpaceUpdateLog.create({
//       space: spaceId,
//       tag: tagIds[0],
//       updatedBy: createdBy,
//       updatedAt: new Date(),
//     });

//     // tagのupdate logを作る。
//     if (tagIds.length) {
//       const tagUpdateLogObjects = tagIds.map((tagId) => {
//         return {
//           tag: tagId,
//           updatedBy: createdBy,
//           updatedAt: new Date(),
//         };
//       });

//       const tagUpdateLogDocuments = await TagUpdateLog.insertMany(tagUpdateLogObjects);
//     }

//     // ---------------------

//     const spaceAndUserRelationships = await SpaceAndUserRelationship.find({
//       space: spaceId,
//       user: { $ne: createdBy },
//     })
//       .populate({ path: 'user' })
//       .select({ pushToken: 1 });
//     const membersPushTokens = spaceAndUserRelationships.map((rel) => {
//       return rel.user.pushToken;
//     });

//     let notificationTitle = '';

//     const notificationData = {
//       notificationType: 'Post',
//       spaceId: spaceId,
//       tagId: tagIds[0],
//     };

//     const chunks = expo.chunkPushNotifications(
//       membersPushTokens.map((token) => ({
//         to: token,
//         sound: 'default',
//         data: notificationData,
//         title: 'Member has posted.',
//         body: caption,
//       }))
//     );

//     const tickets = [];

//     for (let chunk of chunks) {
//       try {
//         let receipts = await expo.sendPushNotificationsAsync(chunk);
//         tickets.push(...receipts);
//         console.log('Push notifications sent:', receipts);
//       } catch (error) {
//         console.error('Error sending push notification:', error);
//       }
//     }

//     response.status(201).json({
//       post: {
//         _id: post._id,
//         contents: contentDocuments,
//         type: post.type,
//         caption: post.caption,
//         space: spaceId,
//         // locationTag: addingLocationTag ? addingLocationTag._id : null,
//         createdBy: post.createdBy, // これのせいで、作った後avatarが表示されない。
//         createdAt: post.createdAt,
//         disappearAt: post.disappearAt,
//         // content: {
//         //   data: contents[0].data,
//         //   type: contents[0].type,
//         // },
//       },
//       addedTags: [...parsedTags],
//       createdTags: tagObjects ? tagObjects : null,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

export const createMoment = async (request, response) => {
  try {
    const {
      caption, // stringのinput
      createdBy, // stringのinput
      spaceId, // stringのinput
      contents: contentsJSON,
      disappearAfter, // stringでinputくる
    } = request.body;

    const contentObjects = JSON.parse(contentsJSON);
    if (!contentObjects.length) {
      throw new Error('Required to have at least one content.');
    }

    // creation 1: content documentを作る。
    const contentPromises = contentObjects.map((contentObject) => processContent(contentObject));
    const contentDocuments = await Promise.all(contentPromises);

    // creation 2: post documentを作る。
    const disappearAt = new Date(new Date().getTime() + Number(disappearAfter) * 60 * 1000);
    const moment = await Moment.create({
      contents: contentDocuments.map((content) => content._id),
      caption,
      space: spaceId,
      disappearAt: disappearAt,
      createdBy,
    });

    const newMoment = await Moment.populate(moment, {
      path: 'createdBy',
      select: '_id name avatar',
    });

    // creation 3: log documentを作る。
    await Log.create({
      space: spaceId,
      type: 'moment',
      moment: newMoment._id,
      createdBy,
    });

    response.status(201).json({
      data: {
        moment: {
          _id: newMoment._id,
          contents: contentDocuments,
          caption: newMoment.caption,
          space: spaceId,
          createdBy: newMoment.createdBy,
          createdAt: newMoment.createdAt,
          disappearAt: newMoment.disappearAt,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

// disappearAfterの日付に気をつけてfetchしなくちゃいけない。
export const getMomentsBySpaceId = async (request, response) => {
  try {
    const now = new Date(new Date().getTime());
    const moments = await Moment.find({ space: request.params.spaceId, disappearAt: { $gt: now } })
      .populate({
        path: 'contents',
        model: 'Content',
        select: '_id data type',
      })
      .populate({
        path: 'createdBy',
        model: 'User',
        select: '_id name avatar',
      });

    response.status(200).json({
      data: {
        moments,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
