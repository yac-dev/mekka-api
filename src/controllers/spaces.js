import Space from '../models/space';
import SpaceAndUserRelationship from '../models/spaceAndUserRelationship';
import Reaction from '../models/reaction';
import { uploadPhoto } from '../services/s3';
import Post from '../models/post';
import Tag from '../models/tag';
import PostAndTagRelationship from '../models/postAndTagRelationship';
import SpaceAndTagAndPostRelationship from '../models/spaceAndTagAndPostRelationship';
import LocationTag from '../models/locationTag';
import mongoose from 'mongoose';

// space, reactions, spaceAndUserRel, tagを作る。ここのhandlerで。
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

export const createSpace = async (request, response) => {
  try {
    const {
      name,
      contentType,
      description,
      videoLength,
      disappearAfter,
      isPublic,
      isCommentAvailable,
      isReactionAvailable,
      reactions,
      createdBy,
    } = request.body;
    console.log('this is the payload', request.body);
    const userData = JSON.parse(createdBy);
    console.log(userData);

    const randomString = generateRandomString(20);
    const space = new Space({
      name,
      icon: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/icons/${request.file.filename}`,
      contentType,
      description,
      secretKey: randomString,
      isPublic: Boolean(isPublic),
      isCommentAvailable: Boolean(isCommentAvailable),
      isReactionAvailable: Boolean(isReactionAvailable),
      createdBy: new mongoose.Types.ObjectId(userData._id),
      createdAt: new Date(),
      totalPosts: 0,
      totalMembers: 1,
      rate: 0,
    });
    if (contentType === 'video' || contentType === 'photoAndVideo') {
      space.videoLength = videoLength;
    }
    // stayがない、つまりpermananetならここのfieldは埋めない。
    if (Number(disappearAfter)) {
      space.disappearAfter = Number(disappearAfter);
    }

    // reactionを作る。
    if (isReactionAvailable && reactions.length) {
      const reactionOptions = JSON.parse(reactions).map((reaction) => {
        if (reaction.type === 'emoji') {
          return {
            space: space._id,
            type: 'emoji',
            emoji: reaction.emoji,
          };
        } else if (reaction.type === 'sticker') {
          return {
            space: space._id,
            type: 'sticker',
            sticker: reaction.sticker._id,
          };
        }
      });
      // ここで、さらにsendする内容に関しても持っておかないとあかん。
      const createdReactions = await Reaction.insertMany(reactionOptions);
      const reactionIds = createdReactions.map((reaction) => reaction._id);
      space.reactions = reactionIds; // spaceに直接idを入れる。
    }

    const spaceAndUserRelationship = await SpaceAndUserRelationship.create({
      space: space._id,
      user: userData._id,
      createdAt: new Date(),
    });
    space.save();
    await uploadPhoto(request.file.filename, 'icon');

    // tagを作るだけでいいのかね。もしかしたら。
    // tagの数は、結構多くの数になる。spaceが全部持っておくのはベストではないだろう。それよりも、他にdelegateする方がいい。
    const tag = await Tag.create({
      iconType: 'icon',
      icon: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/tagIcons/hashtag-normal.png`,
      name: 'general',
      color: 'white',
      count: 1,
      space: space._id,
      createdBy: userData._id,
      updatedAt: new Date(),
    });

    response.status(201).json({
      spaceAndUserRelationship: {
        _id: spaceAndUserRelationship._id,
        space: {
          _id: space._id,
          name: space.name,
          icon: space.icon,
          contentType: space.contentType,
          description: space.description,
          secretKey: space.secretKey,
          isPublic: space.isPublic,
          isCommentAvailable: space.isCommentAvailable,
          isReactionAvailable: space.isReactionAvailable,
          videoLength: space.videoLength,
          disappearAfter: space.disappearAfter,
          reactions: space.isReactionAvailable ? JSON.parse(reactions) : undefined,
          createdBy: userData,
          createdAt: space.createdAt,
          totalPosts: space.totalPosts,
          totalMembers: space.totalMembers,
          rate: space.rate,
        },
      },
    });

    // tagを作る。
    // {icon: '', name: '', color: ''} // defaultでは、iconは無しでいい。
    // const tagObjects = JSON.parse(tags).map((tag) => {
    //   return {
    //     icon: '',
    //     name: tag,
    //     color: '',
    //   };
    // });
    // const tagDocuments = await Tag.insertMany(tagObjects);
    // const tagIds = tagDocuments.map((tag) => tag._id);
    // const tagSpaceRels = tagIds.map((tagId) => {
    //   return {
    //     tag: tagId,
    //     space: space._id,
    //   };
    // });
    // space.tags = tagIds;

    // const tagAndSpaceRelationships = await TagAndSpaceRelationship.insertMany(tagSpaceRels);
  } catch (error) {
    console.log(error);
  }
};

export const getSpaces = async (request, response) => {
  try {
    const spaces = await Space.find({ isPublic: true })
      .select({
        _id: true,
        name: true,
        icon: true,
        contentType: true,
        disappearAfter: true,
        videoLength: true,
        isReactionAvailable: true,
        description: true,
        reactions: true,
      })
      .populate({
        path: 'reactions',
        model: 'Reaction',
        populate: {
          path: 'sticker',
          model: 'Sticker',
        },
      });
    response.status(200).json({
      spaces,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSpaceById = async (request, response) => {
  try {
    const space = await Space.findById(request.params.spaceId)
      .populate({
        path: 'reactions',
        model: 'Reaction',
        populate: {
          path: 'sticker',
          model: 'Sticker',
        },
      })
      .populate({
        path: 'createdBy',
        model: 'User',
        select: '_id name avatar',
      });
    console.log('hi');
    response.status(200).json({
      space,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getPostsBySpaceId = async (request, response) => {
  try {
    const documents = await Post.find({
      space: request.params.spaceId,
      $or: [
        { disappearAt: { $gt: new Date() } }, // disapperAt greater than current time
        { disappearAt: null }, // disapperAt is null
      ],
      createdBy: { $ne: null }, // 存在しないuserによるpostはfetchしない。
    })
      .select({
        _id: true,
        contents: true,
        caption: true,
        spaceId: true,
        createdBy: true,
        createdAt: true,
      })
      .sort({ createdAt: -1 })
      .populate([
        {
          path: 'contents',
          model: 'Content',
          select: '_id data type',
        },
        {
          path: 'createdBy',
          model: 'User',
          select: '_id name avatar',
        },
      ]);
    // postのidと、contents[0]のdata, typeだけ欲しい。
    // {post: postId, content: {data: "....", type: "video"}}
    const posts = documents.map((post, index) => {
      return {
        _id: post._id,
        content: {
          data: post.contents[0].data,
          type: post.contents[0].type,
        },
      };
    });

    response.status(200).json({
      posts,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getPostsBySpaceIdAndYearAndMonth = async (request, response) => {
  try {
    const { yearAndMonth } = request.params;
    const year = yearAndMonth.split('-')[0];
    const month = yearAndMonth.split('-')[1];

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    // const libraryAssets = [];
    const documents = await Post.find({
      space: request.params.spaceId,
      createdAt: { $gte: startDate, $lt: endDate },
      $or: [
        { disappearAt: { $gt: new Date() } }, // disapperAt greater than current time
        { disappearAt: null }, // disapperAt is null
      ],
      createdBy: { $ne: null },
    }).populate({
      path: 'contents',
      model: 'Content',
      select: '_id data type',
    });

    const posts = documents.map((post, index) => {
      return {
        _id: post._id,
        content: {
          data: post.contents[0].data,
          type: post.contents[0].type,
        },
        createdAt: post.createdAt,
      };
    });

    response.status(200).json({
      posts,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getTagsBySpaceId = async (request, response) => {
  try {
    // relationshipのtableでもないし、大丈夫か。
    const documents = await Tag.find({ space: request.params.spaceId });
    response.status(200).json({
      tags: documents,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getLocationTagsBySpaceId = async (request, response) => {
  try {
    const documents = await LocationTag.find({ space: request.params.spaceId });
    response.status(200).json({
      locationTags: documents,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getPeopleBySpaceId = async (request, response) => {
  try {
    // relationshipのtableでもないし、大丈夫か。
    const documents = await SpaceAndUserRelationship.find({ space: request.params.spaceId }).populate({ path: 'user' });
    const people = documents.map((relationship, index) => {
      return relationship.user;
    });
    response.status(200).json({
      people,
    });
  } catch (error) {
    console.log(error);
  }
};

// path: 'space',
// populate: [
// {
//   path: 'reactions',
//   select: '_id type emoji sticker',
//   model: 'Reaction',
//   populate: {
//     path: 'sticker',
//     model: 'Sticker',
//   },
// },
// {
//   path: 'createdBy',
//   select: '_id name avatar',
// },
// ],
export const joinPrivateSpaceBySecretKey = async (request, response) => {
  try {
    const { userId, secretKey } = request.body;
    const space = await Space.findOne({ secretKey }).populate([
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
    ]);
    // 既にspaceに参加している場合は、エラーを返す。
    const document = await SpaceAndUserRelationship.findOne({
      user: userId,
      space: space._id,
    });

    let spaceAndUserRelationship;
    if (document) {
      throw new Error('Already joined this space.');
    } else {
      spaceAndUserRelationship = await SpaceAndUserRelationship.create({
        user: userId,
        space: space._id,
        createdAt: new Date(),
        lastCheckedIn: new Date(),
      });
    }

    response.status(201).json({
      spaceAndUserRelationship: {
        _id: spaceAndUserRelationship._id,
        space,
      },
    });
  } catch (error) {
    console.log(error.message, error.name);
    response.status(400).json({
      message: 'OOPS! You have already joined this space.',
    });
  }
};

export const joinPublicSpace = async (request, response) => {
  try {
    const { space, userId } = request.body;
    const spaceAndUserRelationship = await SpaceAndUserRelationship.create({
      user: userId,
      space: request.params.spaceId,
      createdAt: new Date(),
      lastCheckedIn: new Date(),
    });

    const spaceDocument = await Space.findById(space._id).populate([
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
    ]);

    response.status(201).json({
      spaceAndUserRelationship: {
        _id: spaceAndUserRelationship._id,
        space: spaceDocument,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
