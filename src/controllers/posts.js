import Space from '../models/space.js';
import Post from '../models/post.js';
import Content from '../models/content.js';
import ReactionStatus from '../models/reactionStatus.js';
import Comment from '../models/comment.js';
import Tag from '../models/tag.js';
import Log from '../models/log.js';
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
const expo = new Expo();
const unlinkFile = util.promisify(fs.unlink);

// post時に何をするかだね。
// transaction, atomicityの実装。atlasで使えるのかな？？
// contentsを作って、postを作って、reactionStatusを作って、tagを作って、もしくはtagをupdateして、spaceLogを作って、tagLogを作る。
// かなりのoperationが必要になるよな。。。
// export const createPost = async (request, response) => {
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();
//     // postで、reactionを全部持っておかないとね。
//     const { caption, createdBy, spaceId, reactions, addedTags, createdTags, createdLocationTag, addedLocationTag } =
//       request.body;
//     console.log('created tags', createdTags);
//     console.log('added tags', addedTags);
//     console.log('created locationtag', createdLocationTag);
//     console.log('added location tag', addedLocationTag);

//     // const disappearAt = new Date(new Date().getTime() + Number(disappearAfter) * 60 * 1000);
//     // 現在の時間にdissaperAfter(minute)を足した日時を出す。
//     // const parsedLocation = JSON.parse(location);
//     const parsedReactions = JSON.parse(reactions);
//     const parsedTags = JSON.parse(addedTags);
//     const parsedCreatedTags = JSON.parse(createdTags);
//     // const parsedLocationTag = JSON.parse(addedLocationTag);
//     const files = request.files;
//     const createdAt = new Date();
//     const contentIds = [];
//     const contents = [];
//     let parsedCreatedLocationTag;
//     if (createdLocationTag) {
//       parsedCreatedLocationTag = JSON.parse(createdLocationTag);
//     }

//     // 1 contentsを作る。
//     // batch creation
//     // そう言うことで言うと、contentsのidもだわ。。。
//     const contentPromises = files.map(async (file) => {
//       const contentId = new mongoose.Types.ObjectId();
//       contentIds.push(contentId);
//       const content = await Content.create(
//         [
//           {
//             _id: contentId,
//             data: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/${
//               file.mimetype === 'image/jpeg' ? 'photos' : 'videos'
//             }/${file.filename}`,
//             type: file.mimetype === 'image/jpeg' ? 'photo' : 'video',
//             createdBy,
//             createdAt,
//           },
//         ],
//         { session }
//       );
//       contents.push(content);
//       // contentIds.push(content._id);
//       await uploadPhoto(file.filename, content.type);
//       return content;
//     });
//     const contentDocuments = await Promise.all(contentPromises, { session });

//     // for (let file of files) {
//     //   const content = await Content.create({
//     //     data: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/${
//     //       file.mimetype === 'image/jpeg' ? 'photos' : 'videos'
//     //     }/${file.filename}`,
//     //     type: file.mimetype === 'image/jpeg' ? 'photo' : 'video',
//     //     createdBy,
//     //     createdAt,
//     //   });
//     //   contents.push(content);
//     //   contentIds.push(content._id);
//     //   await uploadPhoto(file.filename, content.type);
//     // }
//     // そもそも、これspaceもfetchしなきゃいけないよな。。。こういうの、すげー効率がなー。
//     var postId = new mongoose.Types.ObjectId();
//     // 2,postを作る
//     const locationTagId = new mongoose.Types.ObjectId();
//     let locationTag;
//     if (createdLocationTag) {
//       locationTag = await LocationTag.create(
//         [
//           {
//             _id: locationTagId,
//             iconType: parsedCreatedLocationTag.iconType,
//             icon: parsedCreatedLocationTag.icon,
//             image: parsedCreatedLocationTag.image,
//             name: parsedCreatedLocationTag.name,
//             point: parsedCreatedLocationTag.point,
//             color: parsedCreatedLocationTag.color,
//             space: spaceId,
//             createdBy: createdBy,
//           },
//         ],
//         { session }
//       );
//     }

//     const post = await Post.create(
//       [
//         {
//           _id: postId,
//           contents: contentIds,
//           caption,
//           space: spaceId,
//           locationTag: createdLocationTag ? locationTagId : addedLocationTag,
//           createdBy,
//           createdAt,
//         },
//       ],
//       { session }
//     );

//     // 3 reactionのstatusを作る。
//     const reacionStatusObjects = parsedReactions.map((reactionId) => {
//       return {
//         post: postId,
//         reaction: reactionId,
//         count: 0,
//       };
//     });
//     const reactionAndStatuses = await ReactionStatus.insertMany(reacionStatusObjects, { session });

//     const tagIds = [];

//     // 4 新しいtagを作る、もし、createdTagsがあったら。
//     if (parsedCreatedTags.length) {
//       const tagObjects = parsedCreatedTags.map((tag) => {
//         const tagId = new mongoose.Types.ObjectId();
//         tagIds.push(tagId);
//         return {
//           _id: tagId,
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
//       const tagDocuments = await Tag.insertMany(tagObjects, { session });
//       // tagDocuments.forEach((tagDocument) => {
//       //   tagIds.push(tagDocument._id);
//       // });s
//     }

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
//       await Promise.all(updatePromises, { session });
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
//           post: postId,
//           tag: tagId,
//         };
//       });

//       const postAndTagRelationshipDocuments = await PostAndTagRelationship.insertMany(postAndTagRelationshipObjects, {
//         session,
//       });
//     }
//     await session.commitTransaction();

//     response.status(201).json({
//       post: {
//         _id: postId,
//         content: {
//           data: contents[0].data,
//           type: contents[0].type,
//         },
//       },
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.log(error);
//     response.status(500).json({ error: 'An error occurred' });
//   } finally {
//     session.endSession();
//   }
// };

const sharpImage = async (inputFileName) => {
  const __dirname = path.resolve();
  const fileInput = path.join(__dirname, 'buffer', inputFileName);
  const outputFileName = `${inputFileName.split('.')[0]}.webp`;
  const outputPath = path.join(__dirname, 'buffer', outputFileName);
  // sharp(fileInput).resize(null, 300).webp({ quality: 80 }).toFile(outputPath);
  const processed = await sharp(fileInput)
    .resize(700)
    .webp({ quality: 1 })
    // .toFile(outputPath)
    .toBuffer((err, data) => console.log('finished...'));
  return processed;
};

const optimizeVideo = (originalFileName, newFileName) => {
  const compressOptions = {
    videoCodec: 'libx264', // 使用するビデオコーデック
    audioCodec: 'aac', // 使用するオーディオコーデック
    size: '990x540', // 出力動画の解像度
  };
  const __dirname = path.resolve();
  const inputFilePath = path.join(__dirname, 'buffer', originalFileName);
  const outputFilePath = path.join(__dirname, 'buffer', newFileName);
  const command = `ffmpeg -i ${inputFilePath} -vcodec h264 -b:v:v 1500k -acodec mp3 ${outputFilePath}`;
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) console.log('Error ', err);
      else {
        // ここでoriginalの動画を消して、optimizeされた動画をaws uploadのlogicに渡す感じだ。
        resolve(outputFilePath);
      }
    });
  });
};

// const optimizeVideo = (originalFileName, newFileName) => {
//   const compressOptions = {
//     videoCodec: 'libx264', // 使用するビデオコーデック
//     audioCodec: 'aac', // 使用するオーディオコーデック
//     size: '540x990', // 出力動画の解像度
//   };
//   const __dirname = path.resolve();
//   const inputFilePath = path.join(__dirname, 'buffer', originalFileName);
//   const outputFilePath = path.join(__dirname, 'buffer', newFileName);
//   // const command = `ffmpeg -i ${inputFilePath} -vcodec h264 -b:v:v 1500k -acodec mp3 ${outputFilePath}`;
//   return new Promise((resolve, reject) => {
//     ffmpeg(inputFilePath)
//       .outputOptions(['-q:v 1', '-q:a 1']) // クオリティの設定
//       .videoCodec(compressOptions.videoCodec)
//       .audioCodec(compressOptions.audioCodec)
//       .size(compressOptions.size)
//       .on('end', () => {
//         resolve(outputFilePath);
//         console.log('COMPRESS COMPLETED👏');
//       })
//       .on('error', (err) => {
//         console.error('error happened🖕', err);
//       })
//       .save(outputFilePath);
//   });
// };

// photo postと、video postで、場合わけをしないといけないな。。。
// videoの場合は、ffmpeg通さないといけないから。
export const experiment = async (request, response) => {
  try {
    const data = request.file.filename;
    console.log(data);
    // const sharpedImageBinary = await sharpImage(contentObject.fileName);
    const __dirname = path.resolve();
    const fileInput = path.join(__dirname, 'buffer', request.file.filename);
    const outputFileName = `${request.file.filename.split('.')[0]}.webp`;
    const outputPath = path.join(__dirname, 'buffer', outputFileName);
    const processed = await sharp(fileInput).resize(700).webp({ quality: 1 }).toFile(outputPath);
    // .toBuffer((err, data) => console.log(data));
    response.status(201).json({
      message: 'success',
    });
  } catch (error) {
    console.log(error);
  }
};

export const createPost = async (request, response) => {
  try {
    // postで、reactionを全部持っておかないとね。
    const {
      caption,
      createdBy,
      spaceId,
      reactions,
      addedTags,
      createdTags,
      createdLocationTag,
      addedLocationTag,
      contents,
      type,
      disappearAfter,
      location,
    } = request.body;
    // 現在の時間にdissaperAfter(minute)を足した日時を出す。
    // const parsedLocation = JSON.parse(location);
    const createdAt = new Date();
    const disappearAt = new Date(createdAt.getTime() + Number(disappearAfter) * 60 * 1000);
    const parsedReactions = JSON.parse(reactions);
    const parsedTags = JSON.parse(addedTags);
    const parsedCreatedTags = JSON.parse(createdTags);
    const parsedLocation = JSON.parse(location);
    // const parsedLocationTag = JSON.parse(addedLocationTag);
    const files = request.files;
    const contentIds = [];
    // const contents = [];
    console.log('these are contents ', JSON.parse(contents));
    let parsedCreatedLocationTag;
    // if (createdLocationTag) {
    //   parsedCreatedLocationTag = JSON.parse(createdLocationTag);
    // }
    // let parsedAddedLocationTag;
    // if (addedLocationTag) {
    //   parsedAddedLocationTag = JSON.parse(addedLocationTag);
    // }
    console.log('request body from  ', request.body);

    // console.log(parsedCreatedLocationTag);
    // console.log(parsedAddedLocationTag);
    // console.log(request);

    // まあ、一応動く。ただ、icon upload部分の動きも変わっちゃっている。そこを直さないといいかん。
    const contentPromises = JSON.parse(contents).map(async (contentObject) => {
      let fileName;
      if (contentObject.type === 'photo') {
        fileName = `${contentObject.fileName.split('.')[0]}.webp`;
      } else if (contentObject.type === 'video') {
        // --- ver1 ffmpeg通す時のやつ
        // fileName = `optimized-${contentObject.fileName.split('.')[0]}.mp4`;
        // -----
        fileName = `${contentObject.fileName.split('.')[0]}.mp4`;
      }
      const content = await Content.create({
        data: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/${
          contentObject.type === 'photo' ? 'photos' : 'videos'
        }/${fileName}`,
        type: contentObject.type,
        duration: contentObject.duration,
        createdBy,
        createdAt,
      });
      contentIds.push(content._id);
      // // ここでsharpしてoutputする必要があって、そのoutputをawsにあげるっていう流れだよな。
      // await uploadPhoto(content.fileName, content.type);
      // return content;
      // ここで場合わけをするか。photoかvideoか。
      if (contentObject.type === 'photo') {
        const sharpedImageBinary = await sharpImage(contentObject.fileName);
        await uploadPhoto(contentObject.fileName, fileName, content.type, sharpedImageBinary);
        return content;
      } else if (contentObject.type === 'video') {
        // --- ver1
        // ffmpegを通して、
        const outputFileName = `optimized-${contentObject.fileName}`;
        const optimizedVideoFilePath = await optimizeVideo(contentObject.fileName, outputFileName);
        const fileStream = fs.createReadStream(optimizedVideoFilePath);
        // awsにuploadする。
        await uploadPhoto(contentObject.fileName, fileName, content.type, fileStream);
        await unlinkFile(optimizedVideoFilePath);
        return content;
        // ---

        // ver2
        // await uploadVideo(contentObject.fileName);
        // return content;
      }
    });

    // 1 contentsを作る。
    // batch creation
    // そっか、これあれだわな。。。fileで作っちゃっているからdurationをつけようがないよな。。
    // -----------------
    // const contentPromises = files.map(async (file) => {
    //   const content = await Content.create({
    //     data: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/${
    //       file.mimetype === 'image/jpeg' ? 'photos' : 'videos'
    //     }/${file.filename}`,
    //     type: file.mimetype === 'image/jpeg' ? 'photo' : 'video',
    //     duration: file.mimetype === 'image/jpeg' ? null : duration,
    //     createdBy,
    //     createdAt,
    //   });
    //   contentIds.push(content._id);
    //   await uploadPhoto(file.filename, content.type);
    //   return content;
    // });
    const contentDocuments = await Promise.all(contentPromises);

    // // 2,postを作る
    // let locationTag;
    // if (createdLocationTag) {
    //   locationTag = await LocationTag.create({
    //     iconType: parsedCreatedLocationTag.iconType,
    //     icon: parsedCreatedLocationTag.icon,
    //     image: parsedCreatedLocationTag.image,
    //     name: parsedCreatedLocationTag.name,
    //     point: parsedCreatedLocationTag.point,
    //     color: parsedCreatedLocationTag.color,
    //     space: spaceId,
    //     createdBy: createdBy,
    //   });
    // }

    // let addingLocationTag;
    // if (createdLocationTag) {
    //   addingLocationTag = createdLocationTag;
    // } else if (addedLocationTag) {
    //   addingLocationTag = addedLocationTag;
    // } else {
    //   addingLocationTag = null;
    // }

    // console.log(addingLocationTag);

    const post = await Post.create({
      contents: contentIds,
      type,
      caption,
      space: spaceId,
      // locationTag: addingLocationTag ? addingLocationTag._id : null,
      location: parsedLocation,
      disappearAt: type === 'moment' ? disappearAt : null,
      createdBy,
      createdAt,
    });

    // 3 reactionのstatusを作る。
    const reacionStatusObjects = parsedReactions.map((reactionId) => {
      return {
        post: post._id,
        reaction: reactionId,
        count: 0,
      };
    });
    const reactionAndStatuses = await ReactionStatus.insertMany(reacionStatusObjects);

    const tagIds = [];

    // 4 新しいtagを作る、もし、createdTagsがあったら。
    // ここは、多分tagの_idでやるべきだよね。。。
    // nameがhashのiconを見つけて、その_idを埋め込む必要がある。。。
    let createdTagDocuments;
    let tagObjects;
    // client側でもうhashTagを持っておこうか。。。
    if (parsedCreatedTags.length) {
      tagObjects = parsedCreatedTags.map((tag) => {
        return {
          _id: new mongoose.Types.ObjectId(),
          iconType: tag.iconType,
          icon: tag.icon,
          color: tag.color,
          image: tag.image,
          name: tag.name,
          count: 1,
          space: spaceId,
          createdBy: createdBy,
          updatedAt: new Date(),
        };
      });

      const inserting = tagObjects.map((tagObject) => {
        return {
          _id: tagObject._id,
          iconType: tagObject.iconType,
          icon: tagObject.icon._id,
          color: tagObject.color,
          image: tagObject.image,
          name: tagObject.name,
          count: 1,
          space: spaceId,
          createdBy: createdBy,
          updatedAt: new Date(),
        };
      });
      // iconを、url付きで返したいのよ。
      createdTagDocuments = await Tag.insertMany(inserting);
      createdTagDocuments.forEach((tagDocument) => {
        tagIds.push(tagDocument._id);
      });
      // ここでspaceも更新しないといかんのか。
      const space = await Space.findById(spaceId);
      const createdTagIds = createdTagDocuments.map((tag) => tag._id);
      space.tags.push(...createdTagIds);
      space.save();
    }

    let addedExistingTags;
    // だから、client側ではtagのidだけを入れておく感じな。
    if (parsedTags.length) {
      // parsedTags
      const tags = await Tag.find({ _id: { $in: parsedTags } });
      const updatePromises = tags.map((tag) => {
        tag.count += 1;
        tag.updatedAt = new Date();
        return tag.save();
      });

      // Execute all update promises in parallel
      await Promise.all(updatePromises);
      tagIds.push(...parsedTags);
      // parsedTags.forEach((tagId) => {
      //   tagIds.push(tagId);
      // });
    }

    // tagIdsをもとにpostAndTagのrelationshipを作る、もちろん最終的にtagIdsのlengthがあったらね。
    // 最終的に、つけられたtagとpostのrelationshipを作る。
    if (tagIds.length) {
      const postAndTagRelationshipObjects = tagIds.map((tagId) => {
        return {
          post: post._id,
          tag: tagId,
        };
      });

      const postAndTagRelationshipDocuments = await PostAndTagRelationship.insertMany(postAndTagRelationshipObjects);
    }
    // spaceのupdateLogを作る。
    // const spaceUpdateLog = await SpaceUpdateLog.create({
    //   space: spaceId,
    //   post: post._id,
    //   tag: tagIds[0],
    //   createdBy: createdBy,
    //   createdAt: new Date(),
    // });
    const log = await Log.create({
      space: spaceId,
      type: 'normal',
      post: post._id,
      tag: tagIds[0],
      createdBy: createdBy,
      createdAt: new Date(),
    });
    // ここでspaceに関するlogを作る。

    // tagのupdate logを作る。
    // if (tagIds.length) {
    //   const tagUpdateLogObjects = tagIds.map((tagId) => {
    //     return {
    //       tag: tagId,
    //       updatedBy: createdBy,
    //       updatedAt: new Date(),
    //     };
    //   });

    //   const tagUpdateLogDocuments = await TagUpdateLog.insertMany(tagUpdateLogObjects);
    // }

    // ---------------------

    const spaceAndUserRelationships = await SpaceAndUserRelationship.find({
      space: spaceId,
      user: { $ne: createdBy },
    })
      .populate({ path: 'user' })
      .select({ pushToken: 1 });
    const membersPushTokens = spaceAndUserRelationships.map((rel) => {
      return rel.user.pushToken;
    });

    let notificationTitle = '';

    const notificationData = {
      notificationType: 'Post',
      spaceId: spaceId,
      tagId: tagIds[0],
    };

    const chunks = expo.chunkPushNotifications(
      membersPushTokens.map((token) => ({
        to: token,
        sound: 'default',
        data: notificationData,
        title: 'Member has posted.',
        body: caption,
      }))
    );

    const tickets = [];

    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...receipts);
        console.log('Push notifications sent:', receipts);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    response.status(201).json({
      data: {
        post: {
          _id: post._id,
          contents: contentDocuments,
          type: post.type,
          caption: post.caption,
          space: spaceId,
          // locationTag: addingLocationTag ? addingLocationTag._id : null,
          createdBy: post.createdBy, // これのせいで、作った後avatarが表示されない。
          createdAt: post.createdAt,
          disappearAt: post.disappearAt,
          // content: {
          //   data: contents[0].data,
          //   type: contents[0].type,
          // },
        },
        addedTags: [...parsedTags],
        createdTags: tagObjects ? tagObjects : null,
      },
    });
    // ---------------------
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: 'An error occurred' });
  }
};

export const createMoment = async (request, response) => {
  try {
    const { caption, createdBy, spaceId, reactions, contents, type, disappearAfter } = request.body;
    console.log('got moment post request');
    const createdAt = new Date();
    const disappearAt = new Date(createdAt.getTime() + Number(disappearAfter) * 60 * 1000);
    const parsedReactions = JSON.parse(reactions);
    const files = request.files;
    const contentIds = [];

    const contentPromises = JSON.parse(contents).map(async (contentObject) => {
      let fileName;
      if (contentObject.type === 'photo') {
        fileName = `${contentObject.fileName.split('.')[0]}.webp`;
      } else if (contentObject.type === 'video') {
        // --- ver1 ffmpeg通す時のやつ
        // fileName = `optimized-${contentObject.fileName.split('.')[0]}.mp4`;
        // -----
        fileName = `${contentObject.fileName.split('.')[0]}.mp4`;
      }
      const content = await Content.create({
        data: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/${
          contentObject.type === 'photo' ? 'photos' : 'videos'
        }/${fileName}`,
        type: contentObject.type,
        duration: contentObject.duration,
        createdBy,
        createdAt,
      });
      contentIds.push(content._id);
      // // ここでsharpしてoutputする必要があって、そのoutputをawsにあげるっていう流れだよな。
      // await uploadPhoto(content.fileName, content.type);
      // return content;
      // ここで場合わけをするか。photoかvideoか。
      if (contentObject.type === 'photo') {
        const sharpedImageBinary = await sharpImage(contentObject.fileName);
        await uploadPhoto(contentObject.fileName, fileName, content.type, sharpedImageBinary);
        return content;
      } else if (contentObject.type === 'video') {
        // --- ver1
        // ffmpegを通して、
        const outputFileName = `optimized-${contentObject.fileName}`;
        const optimizedVideoFilePath = await optimizeVideo(contentObject.fileName, outputFileName);
        const fileStream = fs.createReadStream(optimizedVideoFilePath);
        // awsにuploadする。
        await uploadPhoto(contentObject.fileName, fileName, content.type, fileStream);
        await unlinkFile(optimizedVideoFilePath);
        return content;
        // ---

        // ver2
        // await uploadVideo(contentObject.fileName);
        // return content;
      }
    });

    const contentDocuments = await Promise.all(contentPromises);
    const post = await Post.create({
      contents: contentIds,
      type,
      caption,
      space: spaceId,
      disappearAt: type === 'moment' ? disappearAt : null,
      createdBy,
      createdAt,
    });

    // 3 reactionのstatusを作る。
    const reacionStatusObjects = parsedReactions.map((reactionId) => {
      return {
        post: post._id,
        reaction: reactionId,
        count: 0,
      };
    });
    const reactionAndStatuses = await ReactionStatus.insertMany(reacionStatusObjects);

    // const spaceAndUserRelationships = await SpaceAndUserRelationship.find({
    //   space: spaceId,
    //   user: { $ne: createdBy },
    // })
    //   .populate({ path: 'user' })
    //   .select({ pushToken: 1 });
    // const membersPushTokens = spaceAndUserRelationships.map((rel) => {
    //   return rel.user.pushToken;
    // });

    // let notificationTitle = '';

    // const notificationData = {
    //   notificationType: 'Post',
    //   spaceId: spaceId,
    //   tagId: tagIds[0],
    // };

    // const chunks = expo.chunkPushNotifications(
    //   membersPushTokens.map((token) => ({
    //     to: token,
    //     sound: 'default',
    //     data: notificationData,
    //     title: 'Member has posted.',
    //     body: caption,
    //   }))
    // );

    // const tickets = [];

    // for (let chunk of chunks) {
    //   try {
    //     let receipts = await expo.sendPushNotificationsAsync(chunk);
    //     tickets.push(...receipts);
    //     console.log('Push notifications sent:', receipts);
    //   } catch (error) {
    //     console.error('Error sending push notification:', error);
    //   }
    // }
    const log = await Log.create({
      space: spaceId,
      type: 'moment',
      post: post._id,
      createdBy: createdBy,
      createdAt: new Date(),
    });

    response.status(201).json({
      data: {
        post: {
          _id: post._id,
          contents: contentDocuments,
          type: post.type,
          caption: post.caption,
          space: spaceId,
          createdBy: post.createdBy, // これのせいで、作った後avatarが表示されない。
          createdAt: post.createdAt,
          disappearAt: post.disappearAt,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getPost = async (request, response) => {
  try {
    const document = await Post.findById(request.params.postId)
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
      post: document,
    });
  } catch (error) {
    console.log(error);
  }
};

// tableを取るためだけのqueryが必要なのかね。。。
export const getPostsByTagId = async (request, response) => {
  try {
    const now = new Date(new Date().getTime());
    const page = Number(request.query.page);
    let hasNextPage = true;
    const limitPerPage = 100;
    const sortingCondition = { _id: -1 };
    const postAndTagRelationships = await PostAndTagRelationship.find({
      tag: request.params.tagId,
      // post: { $ne: null },  // これ意味ない。結局、mongoにはrdbmsにおけるjoin的な機能を持ち合わせていないから。
    })
      .sort(sortingCondition)
      .skip(page * limitPerPage)
      .limit(limitPerPage)
      .populate({
        path: 'post',
        model: 'Post',
        select: '_id contents type createdAt createdBy caption location disappearAt totalComments totalReactions',
        populate: [
          {
            path: 'contents',
            model: 'Content',
          },
          { path: 'createdBy', model: 'User', select: '_id name avatar' },
        ],
      });
    // console.log(postAndTagRelationships);

    const posts = postAndTagRelationships
      .filter((relationship) => relationship.post !== null && relationship.post.createdBy !== null)
      .map((relationship, index) => {
        // console.log(relationship.post);
        if (
          relationship.post.type === 'normal' ||
          (relationship.post.type === 'moment' && relationship.post.disappearAt > now)
        ) {
          return {
            _id: relationship.post._id,
            contents: relationship.post.contents,
            type: relationship.post.type,
            caption: relationship.post.caption,
            locationTag: relationship.post.locationTag,
            createdAt: relationship.post.createdAt,
            createdBy: relationship.post.createdBy,
            disappearAt: relationship.post.disappearAt,
            totalComments: relationship.post.totalComments,
            totalReactions: relationship.post.totalReactions,
          };
        }
      })
      .filter((relationship) => relationship);

    // console.log('these are posts', posts);
    if (!posts.length) hasNextPage = false;
    response.status(200).json({
      data: {
        posts,
        currentPage: page + 1,
        hasNextPage,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getPostsByTagIdAndRegion = async (request, response) => {
  try {
    const { region } = request.body;
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const minLat = latitude - latitudeDelta / 2;
    const maxLat = latitude + latitudeDelta / 2;
    const minLng = longitude - longitudeDelta / 2;
    const maxLng = longitude + longitudeDelta / 2;
    const now = new Date(new Date().getTime());

    // console.log('min lat -> ', minLat);
    // console.log('max lat -> ', maxLat);
    // console.log('min lng -> ', minLng);
    // console.log('max lng -> ', maxLng);

    const postAndTagRelationships = await PostAndTagRelationship.find({
      tag: request.params.tagId,
    });
    // console.log('tag id -> ', request.params.tagId);
    const postIds = postAndTagRelationships.map((rel) => rel.post);
    // console.log(postIds);
    const posts = await Post.find({
      _id: { $in: postIds },
      'location.coordinates': {
        $geoWithin: {
          $box: [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
        },
      },
      // disappearAt: {
      //   $gt: now,
      // },
    }).populate([
      {
        path: 'contents',
        model: 'Content',
      },
      { path: 'createdBy', model: 'User', select: '_id name avatar' },
    ]);

    const returning = posts
      .map((post) => {
        if (post.type === 'normal' || (post.type === 'moment' && post.disappearAt > now)) {
          return post;
        }
      })
      .filter((post) => post);
    // 'location.coordinates': {
    //   $geoWithin: {
    //     $box: [
    //       [minLng, minLat],
    //       [maxLng, maxLat],
    //     ],
    //   },
    // },
    // console.log('fetched by map', posts);

    response.status(200).json({
      data: {
        posts: returning,
      },
    });
    // const posts = postAndTagRelationships
    //   .filter((relationship) => relationship.post !== null && relationship.post.createdBY !== null)
    //   .map((relationship, index) => {
    //     // console.log(relationship.post);
    //     return {
    //       _id: relationship.post._id,
    //       contents: relationship.post.contents,
    //       caption: relationship.post.caption,
    //       locationTag: relationship.post.locationTag,
    //       createdAt: relationship.post.createdAt,
    //       createdBy: relationship.post.createdBy,
    //     };
    //   });
  } catch (error) {
    console.log(error);
  }
};

export const getPostsByUserId = async (request, response) => {
  try {
    const documents = await Post.find({
      space: request.params.spaceId,
      // post: { $ne: null },  // これ意味ない。結局、mongoにはrdbmsにおけるjoin的な機能を持ち合わせていないから。
      createdBy: request.params.userId,
    }).populate({
      path: 'contents',
      model: 'Content',
    });

    const posts = documents
      .filter((post) => post.createdBy !== null)
      .map((post, index) => {
        return {
          _id: post._id,
          content: {
            data: post.contents[0].data,
            type: post.contents[0].type,
          },
          location: post.location,
        };
      });

    response.status(200).json({
      posts,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getPostsByLocationTagId = async (request, response) => {
  try {
    const { locationTagId, spaceId } = request.params;
    console.log(locationTagId, spaceId);
    const documents = await Post.find({ locationTag: locationTagId, space: spaceId }).populate({
      path: 'contents',
      model: 'Content',
    });

    const posts = documents
      .filter((post) => post.createdBy !== null)
      .map((post, index) => {
        return {
          _id: post._id,
          content: {
            data: post.contents[0].data,
            type: post.contents[0].type,
          },
          location: post.location,
        };
      });
    console.log(posts);

    response.status(200).json({
      posts,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getCommentsByPostId = async (request, response) => {
  try {
    const comments = await Comment.find({ post: request.params.postId }).populate([
      { path: 'createdBy', model: 'User' },
      { path: 'reply', model: 'Comment' },
    ]);
    console.log('comments here', comments);

    response.status(200).json({
      data: {
        comments,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getMomentPostsBySpaceId = async (request, response) => {
  try {
    const now = new Date(new Date().getTime());
    const posts = await Post.find({ space: request.params.spaceId, disappearAt: { $gt: now } }).populate([
      {
        path: 'contents',
        model: 'Content',
      },
      { path: 'createdBy', model: 'User', select: '_id name avatar' },
    ]);
    console.log('moments post');

    response.status(200).json({
      data: {
        posts,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

// export const getPosts = async (request, response) => {
//   try {
//     const documents = await Post.find({
//       space: request.params.spaceId,
//       $or: [
//         { disappearAt: { $gt: new Date() } }, // disapperAt greater than current time
//         { disappearAt: null }, // disapperAt is null
//       ],
//       createdBy: { $ne: null }, // 存在しないuserによるpostはfetchしない。
//     })
//       .select({ _id: true, contents: true, caption: true, spaceId: true, createdBy: true, createdAt: true })
//       .sort({ createdAt: -1 })
//       .populate([
//         {
//           path: 'contents',
//           model: 'Content',
//           select: '_id data type',
//         },
//         {
//           path: 'createdBy',
//           model: 'User',
//           select: '_id name avatar',
//         },
//       ]);
//     // postのidと、contents[0]のdata, typeだけ欲しい。
//     // {post: postId, content: {data: "....", type: "video"}}
//     const posts = documents.map((post, index) => {
//       return {
//         _id: post._id,
//         content: {
//           data: post.contents[0].data,
//           type: post.contents[0].type,
//         },
//       };
//     });

//     response.status(200).json({
//       posts,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };
