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
const expo = new Expo();
const unlinkFile = util.promisify(fs.unlink);

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

export const createMoment = async (request, response) => {
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

    const moment = await Moment.create({
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
    const spaceUpdateLog = await SpaceUpdateLog.create({
      space: spaceId,
      tag: tagIds[0],
      updatedBy: createdBy,
      updatedAt: new Date(),
    });

    // tagのupdate logを作る。
    if (tagIds.length) {
      const tagUpdateLogObjects = tagIds.map((tagId) => {
        return {
          tag: tagId,
          updatedBy: createdBy,
          updatedAt: new Date(),
        };
      });

      const tagUpdateLogDocuments = await TagUpdateLog.insertMany(tagUpdateLogObjects);
    }

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
    });
  } catch (error) {
    console.log(error);
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

    // const responseData = moments.map((moment) => {
    //   return {
    //     _id: moment._id,
    //     content: {
    //       data: moment.contents[0].data,
    //       type: moment.contents[0].type,
    //     },
    //     createdAt: moment.createdAt,
    //     disappearAt: moment.disappearAt,
    //   };
    // });
    response.status(200).json({
      moments,
    });
  } catch (error) {
    console.log(error);
  }
};
