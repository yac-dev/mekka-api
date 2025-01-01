import Post from '../models/post.js';
import Content from '../models/content.js';
import Comment from '../models/comment.js';
import Tag from '../models/tag.js';
import Log from '../models/log.js';
import PostAndTagRelationship from '../models/postAndTagRelationship.js';
import { uploadPhoto, uploadContentToS3 } from '../services/s3.js';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';
import mongoose from 'mongoose';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { PostAndReactionAndUserRelationship } from '../models/postAndReactionAndUserRelationship.js';
import Reaction from '../models/reaction.js';
import { colorOptios } from '../utils/colorOptions.js';

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
  // sharp(fileInput).resize(null, 300).webp({ quality: 80 }).toFile(outputPath);
  const processed = await sharp(fileInput)
    .rotate() // exif dataを失う前に画像をrotateしておくといいらしい。こうしないと、画像が横向きになりやがる。。。
    .resize({ height: resolution.height, width: resolution.width, fit })
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

    // --- validation ---
    const tagIds = JSON.parse(addedTagsJSON);
    const contentObjects = JSON.parse(contentsJSON);
    if (!tagIds.length) {
      throw new Error('Required to have at least one tag.');
    }
    if (!contentObjects.length) {
      throw new Error('Required to have at least one content.');
    }
    const location = JSON.parse(locationJSON);
    const createdTagObjects = JSON.parse(createdTagsJSON);

    // creation 1: content documentを作る。
    const contentPromises = contentObjects.map((contentObject) => processContent(contentObject));
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

    const newPost = await Post.populate(post, {
      path: 'createdBy',
      select: '_id name avatar',
    });

    // creation 3: 新しいtag documentを作る。
    let tagObjects;
    if (createdTagObjects.length) {
      const newTags = await Tag.insertMany(
        createdTagObjects.map((tagObject) => {
          const color = colorOptios[Math.floor(Math.random() * colorOptios.length)];
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
      await PostAndTagRelationship.insertMany(tagIds.map((tagId) => ({ post: post._id, tag: tagId })));
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
          _id: newPost._id,
          contents: contentDocuments,
          type: newPost.type,
          caption: newPost.caption,
          space: spaceId,
          createdBy: newPost.createdBy,
          createdAt: newPost.createdAt,
          disappearAt: newPost.disappearAt,
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
    const moment = await Post.create({
      contents: contentDocuments.map((content) => content._id),
      type: 'moment',
      caption,
      space: spaceId,
      disappearAt: disappearAt,
      createdBy,
    });

    const newMoment = await Post.populate(moment, {
      path: 'createdBy',
      select: '_id name avatar',
    });

    // creation 3: log documentを作る。
    await Log.create({
      space: spaceId,
      type: 'moment',
      post: newMoment._id,
      createdBy,
    });

    response.status(201).json({
      data: {
        post: {
          _id: newMoment._id,
          contents: contentDocuments,
          type: newMoment.type,
          caption: newMoment.caption,
          space: spaceId,
          createdBy: newMoment.createdBy,
          createdAt: newMoment.createdAt,
          disappearAt: newMoment.disappearAt,
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
    const limitPerPage = 30;
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
            // const totalComments = await Comment.countDocuments({ post: relationship.post._id });
            // // const totalReactions = await ReactionStatus.countDocuments({ post: relationship.post._id });
            // const totalReactions = await PostAndReactionAndUserRelationship.countDocuments({
            //   post: relationship.post._id,
            // });
            // そっかここでやってんのか。。。totalCommentsとか。。。。totalのcomment, totaleReactions取っているから遅くなるんだよな。。。
            return {
              _id: relationship.post._id,
              contents: relationship.post.contents,
              type: relationship.post.type,
              caption: relationship.post.caption,
              createdAt: relationship.post.createdAt,
              createdBy: relationship.post.createdBy,
              disappearAt: relationship.post.disappearAt,
              // totalComments,
              // totalReactions,
              location: relationship.post.location,
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
    const { tagId } = request.params;
    const { region } = request.body;
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const minLat = latitude - latitudeDelta / 2;
    const maxLat = latitude + latitudeDelta / 2;
    const minLng = longitude - longitudeDelta / 2;
    const maxLng = longitude + longitudeDelta / 2;
    const now = new Date();

    // console.log('min lat -> ', minLat);
    // console.log('max lat -> ', maxLat);
    // console.log('min lng -> ', minLng);
    // console.log('max lng -> ', maxLng);

    const posts = await PostAndTagRelationship.aggregate([
      // Match documents with the given tag
      { $match: { tag: new mongoose.Types.ObjectId(tagId) } },
      // Lookup the associated post
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'post',
        },
      },
      // Unwind the post array
      { $unwind: '$post' },
      // Match posts within the specified region
      {
        $match: {
          'post.location.coordinates': {
            $geoWithin: {
              $box: [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
            },
          },
          $or: [
            { 'post.type': 'normal' },
            {
              $and: [{ 'post.type': 'moment' }, { 'post.disappearAt': { $gt: now } }],
            },
          ],
        },
      },
      // Lookup related data (contents and createdBy)
      {
        $lookup: {
          from: 'contents',
          localField: 'post.contents',
          foreignField: '_id',
          as: 'post.contents',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'post.createdBy',
          foreignField: '_id',
          as: 'post.createdBy',
        },
      },
      // Unwind the createdBy array
      { $unwind: '$post.createdBy' },
      // Project only the necessary fields
      {
        $project: {
          _id: '$post._id',
          contents: '$post.contents',
          type: '$post.type',
          caption: '$post.caption',
          createdAt: '$post.createdAt',
          createdBy: {
            _id: '$post.createdBy._id',
            name: '$post.createdBy.name',
            avatar: '$post.createdBy.avatar',
          },
          disappearAt: '$post.disappearAt',
          location: '$post.location',
        },
      },
    ]);

    console.log('posts are -> ', posts);

    response.status(200).json({
      data: {
        posts,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'An error occurred while fetching posts' });
  }
};

// export const getPostsByTagIdAndRegion = async (request, response) => {
//   try {
//     const { region } = request.body;
//     const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
//     const minLat = latitude - latitudeDelta / 2;
//     const maxLat = latitude + latitudeDelta / 2;
//     const minLng = longitude - longitudeDelta / 2;
//     const maxLng = longitude + longitudeDelta / 2;
//     const now = new Date(new Date().getTime());

//     console.log('min lat -> ', minLat);
//     console.log('max lat -> ', maxLat);
//     console.log('min lng -> ', minLng);
//     console.log('max lng -> ', maxLng);

//     const postAndTagRelationships = await PostAndTagRelationship.find({
//       tag: request.params.tagId,
//     });
//     // console.log('tag id -> ', request.params.tagId);
//     const postIds = postAndTagRelationships.map((rel) => rel.post);
//     // console.log(postIds);
//     const posts = await Post.find({
//       _id: { $in: postIds },
//       'location.coordinates': {
//         $geoWithin: {
//           $box: [
//             [minLng, minLat],
//             [maxLng, maxLat],
//           ],
//         },
//       },
//       // disappearAt: {
//       //   $gt: now,
//       // },
//     }).populate([
//       {
//         path: 'contents',
//         model: 'Content',
//       },
//       { path: 'createdBy', model: 'User', select: '_id name avatar' },
//     ]);

//     const returning = posts
//       .map((post) => {
//         if (post.type === 'normal' || (post.type === 'moment' && post.disappearAt > now)) {
//           return post;
//         }
//       })
//       .filter((post) => post);
//     // 'location.coordinates': {
//     //   $geoWithin: {
//     //     $box: [
//     //       [minLng, minLat],
//     //       [maxLng, maxLat],
//     //     ],
//     //   },
//     // },
//     // console.log('fetched by map', posts);

//     response.status(200).json({
//       data: {
//         posts: returning,
//       },
//     });
//     // const posts = postAndTagRelationships
//     //   .filter((relationship) => relationship.post !== null && relationship.post.createdBY !== null)
//     //   .map((relationship, index) => {
//     //     // console.log(relationship.post);
//     //     return {
//     //       _id: relationship.post._id,
//     //       contents: relationship.post.contents,
//     //       caption: relationship.post.caption,
//     //       locationTag: relationship.post.locationTag,
//     //       createdAt: relationship.post.createdAt,
//     //       createdBy: relationship.post.createdBy,
//     //     };
//     //   });
//   } catch (error) {
//     console.log(error);
//   }
// };

// export const getPostsByTagIdAndRegion = async (request, response) => {
//   try {
//     const { mapBounds } = request.body;
//     const { tagId } = request.params;
//     const now = new Date(new Date().getTime());

//     let posts;
//     const { neCoordinates, swCoordinates } = mapBounds;

//     // Use the southwest and northeast coordinates to define the bounding box
//     const [swLng, swLat] = swCoordinates;
//     const [neLng, neLat] = neCoordinates;

//     posts = await Post.find({
//       'location.coordinates': {
//         $geoWithin: {
//           $box: [
//             [swLng, swLat],
//             [neLng, neLat],
//           ],
//         },
//       },
//     }).populate([
//       { path: 'contents', model: 'Content' },
//       { path: 'createdBy', model: 'User', select: '_id name avatar' },
//     ]);
//     const postAndTagRelationships = await PostAndTagRelationship.find({
//       tag: tagId,
//       post: { $in: posts.map((post) => post._id) },
//     });
//     posts = posts.filter((post) => postAndTagRelationships.some((rel) => rel.post.toString() === post._id.toString()));

//     console.log('posts', posts);

//     // if (!mapBounds) {
//     //   // まず、最初のpostを見つける。
//     //   // いやいや、これだとダメだわな。。。
//     //   const firstPost = await Post.findOne({
//     //     'location.coordinates': { $exists: true },
//     //   }).populate([
//     //     { path: 'contents', model: 'Content' },
//     //     { path: 'createdBy', model: 'User', select: '_id name avatar' },
//     //   ]);

//     //   console.log('firstPost is this', JSON.stringify(firstPost, null, 2));

//     //   if (!firstPost) {
//     //     return response.status(404).json({ error: 'No posts with location found for this tag' });
//     //   }

//     //   // Define a range based on the first post's location
//     //   const [longitude, latitude] = firstPost.location.coordinates;
//     //   const latDelta = 9; // Roughly 1000km north-south
//     //   const lngDelta = 9 / Math.cos((latitude * Math.PI) / 180); // Adjust for latitude

//     //   const minLat = latitude - latDelta;
//     //   const maxLat = latitude + latDelta;
//     //   const minLng = longitude - lngDelta;
//     //   const maxLng = longitude + lngDelta;

//     //   // Fetch remaining posts within this range
//     //   const remainingPosts = await Post.find({
//     //     _id: { $ne: firstPost._id },
//     //     'location.coordinates': {
//     //       $geoWithin: {
//     //         $box: [
//     //           [minLng, minLat],
//     //           [maxLng, maxLat],
//     //         ],
//     //       },
//     //     },
//     //   }).populate([
//     //     { path: 'contents', model: 'Content' },
//     //     { path: 'createdBy', model: 'User', select: '_id name avatar' },
//     //   ]);
//     //   posts = [firstPost, ...remainingPosts];
//     //   //最後に、これらのpostのうち、incomingのtag Idが付与されているpostだけをfilterしたい。
//     //   const postAndTagRelationships = await PostAndTagRelationship.find({
//     //     tag: tagId,
//     //     post: { $in: posts.map((post) => post._id) },
//     //   });
//     //   posts = posts.filter((post) =>
//     //     postAndTagRelationships.some((rel) => rel.post.toString() === post._id.toString())
//     //   );
//     // } else {
//     //   const { neCoordinates, swCoordinates } = mapBounds;

//     //   // Use the southwest and northeast coordinates to define the bounding box
//     //   const [swLng, swLat] = swCoordinates;
//     //   const [neLng, neLat] = neCoordinates;

//     //   posts = await Post.find({
//     //     'location.coordinates': {
//     //       $geoWithin: {
//     //         $box: [
//     //           [swLng, swLat],
//     //           [neLng, neLat],
//     //         ],
//     //       },
//     //     },
//     //   }).populate([
//     //     { path: 'contents', model: 'Content' },
//     //     { path: 'createdBy', model: 'User', select: '_id name avatar' },
//     //   ]);
//     //   const postAndTagRelationships = await PostAndTagRelationship.find({
//     //     tag: tagId,
//     //     post: { $in: posts.map((post) => post._id) },
//     //   });
//     //   posts = posts.filter((post) =>
//     //     postAndTagRelationships.some((rel) => rel.post.toString() === post._id.toString())
//     //   );
//     // }

//     const returning = posts.filter((post) => post.createdBy !== null);
//     // console.log('returning', returning);

//     response.status(200).json({
//       data: {
//         posts: returning,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

export const getPostsByUserId = async (request, response) => {
  try {
    const page = Number(request.query.page);
    let hasNextPage = true;
    const limitPerPage = 30;
    const sortingCondition = { _id: -1 };
    const documents = await Post.find({
      space: request.params.spaceId,
      // post: { $ne: null },  // これ意味ない。結局、mongoにはrdbmsにおけるjoin的な機能を持ち合わせていないから。
      createdBy: request.params.userId,
    })
      .sort(sortingCondition)
      .skip(page * limitPerPage)
      .limit(limitPerPage)
      .populate([
        {
          path: 'contents',
          model: 'Content',
        },
        { path: 'createdBy', model: 'User', select: '_id name avatar' },
        { path: 'space', model: 'Space', select: 'reactions' },
      ]);

    const posts = documents
      .filter((post) => post.createdBy !== null)
      .map((post, index) => {
        if (post.type === 'normal') {
          // const totalComments = await Comment.countDocuments({ post: relationship.post._id });
          // // const totalReactions = await ReactionStatus.countDocuments({ post: relationship.post._id });
          // const totalReactions = await PostAndReactionAndUserRelationship.countDocuments({
          //   post: relationship.post._id,
          // });
          // そっかここでやってんのか。。。totalCommentsとか。。。。totalのcomment, totaleReactions取っているから遅くなるんだよな。。。
          return {
            _id: post._id,
            contents: post.contents,
            type: post.type,
            caption: post.caption,
            createdAt: post.createdAt,
            createdBy: post.createdBy,
            disappearAt: post.disappearAt,
            // totalComments,
            // totalReactions,
            location: post.location,
          };
        }
      });

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
          count: { $ifNull: ['$count', 1] },
        },
      },
    ]);

    console.log('reactions', reactions);

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

export const getPostsByUserIdAndRegion = async (request, response) => {
  try {
    const { userId, spaceId } = request.params;
    // const { region } = request.body;
    // const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    // const minLat = latitude - latitudeDelta / 2;
    // const maxLat = latitude + latitudeDelta / 2;
    // const minLng = longitude - longitudeDelta / 2;
    // const maxLng = longitude + longitudeDelta / 2;
    // const now = new Date();

    // console.log('min lat -> ', minLat);
    // console.log('max lat -> ', maxLat);
    // console.log('min lng -> ', minLng);
    // console.log('max lng -> ', maxLng);

    const documents = await Post.find({ createdBy: userId, space: spaceId, location: { $ne: null } }).populate([
      {
        path: 'contents',
        model: 'Content',
      },
      { path: 'createdBy', model: 'User', select: '_id name avatar' },
      { path: 'space', model: 'Space', select: 'reactions' },
    ]);

    const posts = documents
      .filter((post) => post.createdBy !== null)
      .map((post, index) => {
        if (post.type === 'normal') {
          // const totalComments = await Comment.countDocuments({ post: relationship.post._id });
          // // const totalReactions = await ReactionStatus.countDocuments({ post: relationship.post._id });
          // const totalReactions = await PostAndReactionAndUserRelationship.countDocuments({
          //   post: relationship.post._id,
          // });
          // そっかここでやってんのか。。。totalCommentsとか。。。。totalのcomment, totaleReactions取っているから遅くなるんだよな。。。
          return {
            _id: post._id,
            contents: post.contents,
            type: post.type,
            caption: post.caption,
            createdAt: post.createdAt,
            createdBy: post.createdBy,
            disappearAt: post.disappearAt,
            // totalComments,
            // totalReactions,
            location: post.location,
          };
        }
      });

    const filteredPosts = posts.filter((post) => post);

    response.status(200).json({
      data: {
        posts: filteredPosts,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'An error occurred while fetching posts' });
  }
};
