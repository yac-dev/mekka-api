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
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { PostAndReactionAndUserRelationship } from '../models/postAndReactionAndUserRelationship.js';
import Reaction from '../models/reaction.js';
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
// s3にも、これで入れられるのかみたいね。これ使えたら今までの無茶苦茶面倒臭いの全部なくなるから。。。

const sharpImage = async (inputFileName) => {
  const __dirname = path.resolve();
  const fileInput = path.join(__dirname, 'buffer', inputFileName);
  const outputFileName = `${inputFileName.split('.')[0]}.webp`;
  const outputPath = path.join(__dirname, 'buffer', outputFileName);
  // sharp(fileInput).resize(null, 300).webp({ quality: 80 }).toFile(outputPath);
  const processed = await sharp(fileInput)
    .rotate() // exif dataを失う前に画像をrotateしておくといいらしい。こうしないと、画像が横向きになりやがる。。。
    .resize({ height: 1920, width: 1080, fit: 'contain' })
    .webp({ quality: 1 })
    .toBuffer();
  return processed;
};

// ここもできれば、memory内で済ませたいができるんだろうか・・・？
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

const processVideo = () => {};

export const experiment = async (request, response) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const bucketRegion = process.env.AWS_S3_BUCKET_REGION;
    const bucketAccessKey = process.env.AWS_S3_BUCKET_ACCESS_KEY;
    const bucketSecretKey = process.env.AWS_S3_BUCKET_SECRET_KEY;

    const imageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

    const s3 = new S3Client({
      credentials: {
        accessKeyId: bucketAccessKey,
        secretAccessKey: bucketSecretKey,
      },
      region: bucketRegion,
    });
    const sharpedBuffer = await sharp(request.file.buffer)
      .rotate() // exif dataを失う前に画像をrotateしておくといいらしい。こうしないと、画像が横向きになりやがる。。。
      .resize({ height: 1920, width: 1080, fit: 'contain' })
      .webp({ quality: 1 })
      .toBuffer();
    console.log(sharpedBuffer);

    // const params = {
    //   Bucket: bucketName,
    //   Key: imageName(),
    //   Body: sharpedBuffer,
    //   ContentType: request.file.mimetype,
    // };
    // const command = new PutObjectCommand(params);
    // await s3.send(command);

    response.status(201).json({
      message: 'success',
    });
  } catch (error) {
    console.log(error);
  }
};

const optimizeVideoNew = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const ffmpegCommand = ffmpeg(inputBuffer)
      .inputFormat('mp4') // Ensure the input format is specified
      .videoCodec('libx264')
      .audioCodec('aac')
      .size('990x540')
      .on('error', (err) => reject(err))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe();

    ffmpegCommand.on('data', (chunk) => chunks.push(chunk));
  });
};

export const experimentVideo = async (request, response) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const bucketRegion = process.env.AWS_S3_BUCKET_REGION;
    const bucketAccessKey = process.env.AWS_S3_BUCKET_ACCESS_KEY;
    const bucketSecretKey = process.env.AWS_S3_BUCKET_SECRET_KEY;

    const videoName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

    const s3 = new S3Client({
      credentials: {
        accessKeyId: bucketAccessKey,
        secretAccessKey: bucketSecretKey,
      },
      region: bucketRegion,
    });

    const optimizedVideo = await optimizeVideoNew(request.file.buffer);
    console.log(optimizedVideo);

    response.status(201).json({
      message: 'success',
    });
  } catch (error) {
    console.log(error);
  }
};

// video様にthubnailを作りたいが、、、ffmpeg
// そもそもcreatePostってどういうのだっけ？
// 色々なdocument作る部分あって、整理しないといかんよな。。。

// notificationベットで分けた方がいいね。。。
// let notificationTitle = '';

// const spaceAndUserRelationships = await SpaceAndUserRelationship.find({
//   space: spaceId,
//   user: { $ne: createdBy },
// })
//   .populate({ path: 'user' })
//   .select({ pushToken: 1 });
// const membersPushTokens = spaceAndUserRelationships.map((rel) => {
//   return rel.user.pushToken;
// });

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

// そもそもtagのupdateとかやっているんだけどさ、、、これ必要かね。。。。
// もう、log documentを作る様にしたから必要ないよね。。。
export const createPost = async (request, response) => {
  try {
    const {
      caption, // stringのinput
      createdBy, // stringのinput
      spaceId, // stringのinput
      addedTags: addedTagsJSON, // JSON型のinput
      createdTags: createdTagsJSON,
      contents: contentsJSON,
      type, // stringでinputくる
      disappearAfter, // stringでinputくる
      location: locationJSON, // JSON型のinput
    } = request.body;

    const tagIds = JSON.parse(addedTagsJSON);
    if (!tagIds.length) {
      throw new Error('Required to have at least one tag.');
    }
    const location = JSON.parse(locationJSON);
    const createdTagObjects = JSON.parse(createdTagsJSON);
    const contentObjects = JSON.parse(contentsJSON);

    const contentIds = [];
    // ここのlogic直書きやばいから分けた方がいい絶対に。。。
    const contentPromises = contentObjects.map(async (contentObject) => {
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
      if (contentObject.type === 'photo') {
        const sharpedImageBinary = await sharpImage(contentObject.fileName);
        await uploadPhoto(contentObject.fileName, fileName, content.type, sharpedImageBinary);
        return content;
      } else if (contentObject.type === 'video') {
        const outputFileName = `optimized-${contentObject.fileName}`;
        const optimizedVideoFilePath = await optimizeVideo(contentObject.fileName, outputFileName);
        const fileStream = fs.createReadStream(optimizedVideoFilePath);
        // awsにuploadする。
        await uploadPhoto(contentObject.fileName, fileName, content.type, fileStream);
        await unlinkFile(optimizedVideoFilePath);
        return content;
      }
    });

    // creation 1: content documentを作る。
    const contentDocuments = await Promise.all(contentPromises);

    // creation 2: post documentを作る。
    const disappearAt = new Date(new Date().getTime() + Number(disappearAfter) * 60 * 1000);
    const post = await Post.create({
      contents: contentDocuments.map((content) => content._id),
      type,
      caption,
      space: spaceId,
      location,
      disappearAt: type === 'moment' ? disappearAt : null,
      createdBy,
    });

    let tagObjects;
    if (createdTagObjects.length) {
      const newTags = await Tag.insertMany(
        createdTagObjects.map((tagObject) => {
          return {
            iconType: tagObject.iconType,
            icon: tagObject.icon._id,
            color: tagObject.color,
            image: tagObject.image,
            name: tagObject.name,
            space: spaceId,
            createdBy: createdBy,
          };
        })
      );
      newTags.forEach((tag) => {
        tagIds.push(tag._id);
      });
      tagObjects = await Tag.populate(newTags, 'icon');
    }

    // creation 4:  postとtagのrelationshipをここで作る。
    if (tagIds.length) {
      const postAndTagRelationshipDocuments = await PostAndTagRelationship.insertMany(
        tagIds.map((tagId) => ({ post: post._id, tag: tagId }))
      );
    }

    // creation 5: どこのspaceでなんのtag channelで誰が更新したかのlogを作る。
    await Log.create({
      space: spaceId,
      type: 'normal',
      post: post._id,
      tag: tagIds[0],
      createdBy: createdBy,
    });

    response.status(201).json({
      data: {
        post: {
          _id: post._id,
          contents: contentDocuments,
          type: post.type,
          caption: post.caption,
          space: spaceId,
          createdBy: post.createdBy,
          createdAt: post.createdAt,
          disappearAt: post.disappearAt,
          totalComments: 0,
          totalReactions: 0,
        },
        addedTags: [...tagIds],
        createdTags: tagObjects ? tagObjects : null,
      },
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: 'An error occurred' });
  }
};

export const createMoment = async (request, response) => {
  try {
    const { caption, createdBy, spaceId, contents, type, disappearAfter } = request.body;
    console.log('got moment post request');
    const createdAt = new Date();
    const disappearAt = new Date(createdAt.getTime() + Number(disappearAfter) * 60 * 1000);
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
          totalComments: 0,
          totalReactions: 0,
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
          { path: 'space', model: 'Space', select: 'reactions' },
        ],
      });

    // || (relationship.post.type === 'moment' && relationship.post.disappearAt > now)
    // これ必要？？

    const posts = await Promise.all(
      postAndTagRelationships
        .filter((relationship) => relationship.post !== null && relationship.post.createdBy !== null)
        .map(async (relationship) => {
          if (relationship.post.type === 'normal') {
            const totalComments = await Comment.countDocuments({ post: relationship.post._id });
            // const totalReactions = await ReactionStatus.countDocuments({ post: relationship.post._id });
            const totalReactions = await PostAndReactionAndUserRelationship.countDocuments({
              post: relationship.post._id,
            });
            return {
              _id: relationship.post._id,
              contents: relationship.post.contents,
              type: relationship.post.type,
              caption: relationship.post.caption,
              locationTag: relationship.post.locationTag,
              createdAt: relationship.post.createdAt,
              createdBy: relationship.post.createdBy,
              disappearAt: relationship.post.disappearAt,
              totalComments,
              totalReactions,
            };
          }
        })
    );

    // 一応, totalReactionsは撮ってこれるようになったね。

    const filteredPosts = posts.filter((post) => post);

    if (!posts.length) hasNextPage = false;
    response.status(200).json({
      data: {
        posts: filteredPosts,
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

export const getReactionsByPostId = async (request, response) => {
  try {
    const { postId, spaceId } = request.params;
    // const reactionsDocument = await Reaction.find({ space: spaceId }).populate({
    //   path: 'sticker',
    //   model: 'Sticker',
    // });

    // const reactions = await PostAndReactionAndUserRelationship.aggregate([
    //   // aggregation pipelineでは、match stageでid比較したお場合は、monggose objectIdに変換せんといかんらしい。
    //   { $match: { post: new mongoose.Types.ObjectId(postId) } },
    //   // aggragation pipelineのgroupでは, _id nullだと全てをdocumentをcountするっぽい。
    //   {
    //     $group: {
    //       _id: '$reaction',
    //       count: { $sum: 1 },
    //     },
    //   },
    //   // 上のarrayをさらにaggregationする。
    //   {
    //     $lookup: {
    //       from: 'reactions',
    //       localField: '_id', //上でaggregationして得たのがlocalでそれをjoinしていく。それをreactionsという名前でoutputする。
    //       foreignField: '_id',
    //       as: 'reactionDetails',
    //     },
    //   },
    //   // 上の結果arrayをdestructureしていく。
    //   { $unwind: '$reactionDetails' },
    //   {
    //     $lookup: {
    //       from: 'stickers',
    //       localField: 'reactionDetails.sticker',
    //       foreignField: '_id',
    //       as: 'stickerDetails',
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: '$stickerDetails',
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $project: {
    //       // _id: 0,
    //       _id: '$reactionDetails._id',
    //       type: '$reactionDetails.type',
    //       emoji: '$reactionDetails.emoji',
    //       sticker: '$stickerDetails',
    //       caption: '$reactionDetails.caption',
    //       count: '$count',
    //     },
    //   },
    // ]);

    // const reactionDocumentsWithCount = reactionsDocument.map((reactionDoc) => {
    //   const reactionWithCount = reactions.find((reaction) => reaction._id.toString() === reactionDoc._id.toString());
    //   return {
    //     ...reactionDoc.toObject(),
    //     count: reactionWithCount ? reactionWithCount.count : 0,
    //   };
    // });

    // response.status(200).json({
    //   data: {
    //     reactions: reactionDocumentsWithCount,
    //   },
    // });
    const reactions = await Reaction.aggregate([
      { $match: { space: new mongoose.Types.ObjectId(spaceId) } },
      {
        $lookup: {
          from: 'postandreactionanduserrelationships',
          let: { reactionId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$reaction', '$$reactionId'] } } },
            { $match: { post: new mongoose.Types.ObjectId(postId) } },
            { $group: { _id: '$reaction', count: { $sum: 1 } } },
          ],
          as: 'reactionCount',
        },
      },
      {
        $lookup: {
          from: 'stickers',
          localField: 'sticker',
          foreignField: '_id',
          as: 'stickerDetails',
        },
      },
      { $unwind: { path: '$stickerDetails', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          count: { $arrayElemAt: ['$reactionCount.count', 0] },
        },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          emoji: 1,
          sticker: '$stickerDetails',
          caption: 1,
          count: { $ifNull: ['$count', 0] },
        },
      },
    ]);

    response.status(200).json({
      data: {
        reactions,
      },
    });
  } catch (error) {
    response.status(500).json({
      error: error.message,
    });
  }
};

export const createReaction = async (request, response) => {
  try {
    const { postId } = request.params;
    const { reactionId, userId } = request.body;
    console.log('running reactionId', reactionId);
    console.log('userId', userId);
    const reactionRelationship = await PostAndReactionAndUserRelationship.create({
      post: postId,
      reaction: reactionId,
      user: userId,
    });
    response.status(201).json({
      data: {
        reactionId,
      },
    });
  } catch (error) {
    response.status(500).json({
      error: error.message,
    });
  }
};
