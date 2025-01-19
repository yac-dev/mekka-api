import Space from '../models/space.js';
import SpaceAndUserRelationship from '../models/spaceAndUserRelationship.js';
import Reaction from '../models/reaction.js';
import { uploadPhoto, uploadIcon } from '../services/s3.js';
import Post from '../models/post.js';
import Tag from '../models/tag.js';
import LocationTag from '../models/locationTag.js';
import mongoose from 'mongoose';
import TagUpdateLog from '../models/tagUpdateLog.js';
import Icon from '../models/icon.js';
import { colorOptios } from '../utils/colorOptions.js';

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
      isFollowAvailable,
      reactions,
      createdBy,
    } = request.body;
    console.log('this is the payload', request.body);
    const userData = JSON.parse(createdBy);
    const isPublicValue = JSON.parse(isPublic);
    const isCommentAvailableValue = JSON.parse(isCommentAvailable);
    const isReactionAvailableValue = JSON.parse(isReactionAvailable);
    const isFollowAvailableValue = JSON.parse(isFollowAvailable);
    console.log(userData);

    // --------------
    // memory storage使ってiconをs3にあげる。
    const randomString = generateRandomString(12);
    const space = new Space({
      name,
      icon: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/icons/${request.file.filename}`,
      contentType,
      description,
      secretKey: randomString,
      isPublic: isPublicValue,
      isCommentAvailable: isCommentAvailableValue,
      isReactionAvailable: isReactionAvailableValue,
      isFollowAvailable: isFollowAvailableValue,
      createdBy: new mongoose.Types.ObjectId(userData._id),
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

    // なるほど。_idを返してない。だから毎回エラーになってた。。。
    // 返す時と入れる時でdata構造違うの困るわ。。。。
    // 作った後に再度populateでqueryするしかないかな。。。今はそれでいいか。。。
    let reactionOptions;
    // reactionを作る。
    if (isReactionAvailableValue && reactions.length) {
      reactionOptions = JSON.parse(reactions).map((reaction) => {
        if (reaction.type === 'emoji') {
          return {
            _id: new mongoose.Types.ObjectId(),
            space: space._id,
            type: 'emoji',
            emoji: reaction.emoji,
            caption: reaction.caption,
          };
        } else if (reaction.type === 'sticker') {
          return {
            _id: new mongoose.Types.ObjectId(),
            space: space._id,
            type: 'sticker',
            sticker: reaction.sticker,
            caption: reaction.caption,
          };
        }
      });
      //シンプルに、ObjectIdで持っておこうか。
      // ここで、さらにsendする内容に関しても持っておかないとあかん。
      // とりあえず、reaction作った後じゃないと話にならないよね。だってidが必要だから。でも、stickerのreference内容を含んでいないといけないわけで。。。そこがな
      const inserting = reactionOptions.map((reaction) => {
        if (reaction.type === 'emoji') {
          return {
            _id: reaction._id,
            space: reaction.space,
            type: 'emoji',
            emoji: reaction.emoji,
            caption: reaction.caption,
          };
        } else if (reaction.type === 'sticker') {
          return {
            _id: reaction._id,
            space: reaction.space,
            type: 'sticker',
            sticker: reaction.sticker._id,
            caption: reaction.caption,
          };
        }
      });
      const reactionDocuents = await Reaction.insertMany(inserting);
      // createdReactions = reactionDocuents.populate({
      //   path: 'sticker',
      // }); こうやって、作った後のpopulateもできないわけか。。。
      const reactionIds = reactionDocuents.map((reaction) => reaction._id);
      space.reactions = reactionIds; // spaceに直接idを入れる。
      // returningReactions = JSON.parse(reactions).map((reaction) => {
      //   if (reaction.type === 'emoji') {
      //     return {
      //       space: space._id,
      //       type: 'emoji',
      //       emoji: reaction.emoji,
      //     };
      //   } else if (reaction.type === 'sticker') {
      //     return {
      //       space: space._id,
      //       type: 'sticker',
      //       sticker: {
      //         _id: reaction.sticker._id,
      //         url: reaction.sticker.url,
      //         name: reaction.sticker.name,
      //       },
      //     };
      //   }
      // });
    }

    const spaceAndUserRelationship = await SpaceAndUserRelationship.create({
      space: space._id,
      user: userData._id,
    });
    // const sharpedImageBinary = await sharpImage(contentObject.fileName);
    //     await uploadPhoto(contentObject.fileName, fileName, content.type, sharpedImageBinary);
    await uploadIcon(request.file.filename);
    const hashTagIcon = await Icon.findOne({ name: 'hash' });
    //　確かに、作ったあとはもってこれないやシンプルに。

    // tagを作るだけでいいのかね。もしかしたら。
    // tagの数は、結構多くの数になる。spaceが全部持っておくのはベストではないだろう。それよりも、他にdelegateする方がいい。
    const tag = await Tag.create({
      iconType: 'icon',
      icon: hashTagIcon._id,
      name: 'All',
      color: colorOptios[Math.floor(Math.random() * colorOptios.length)],
      count: 1,
      space: space._id,
      createdBy: userData._id,
      updatedAt: new Date(),
    });

    const responsingTag = space.save();
    response.status(201).json({
      data: {
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
          reactions: space.isReactionAvailable ? reactionOptions : undefined,
          createdBy: userData,
          createdAt: space.createdAt,
          rate: space.rate,
          tags: [
            {
              _id: tag._id,
              iconType: tag.iconType,
              icon: hashTagIcon,
              name: tag.name,
              color: tag.color,
              space: tag.space,
              createdBy: tag.createdBy,
              updatedAt: tag.updated,
            },
          ],
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
      data: {
        spaces,
      },
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
      data: {
        space,
      },
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
    // これがいわゆるmoment postのことか。。。
    const { yearAndMonth } = request.params;
    console.log(yearAndMonth);
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
      data: {
        posts,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getTagsBySpaceId = async (request, response) => {
  try {
    const tagDocuments = await Tag.find({ space: request.params.spaceId }).populate({
      path: 'icon',
      model: 'Icon',
    });
    response.status(200).json({
      data: {
        tags: tagDocuments,
      },
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
    console.log('userId', userId);
    console.log('secret key', secretKey);
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

    const tags = await Tag.find({ space: space._id }).populate({
      path: 'icon',
      model: 'Icon',
    });
    // 既にspaceに参加している場合は、エラーを返す。
    console.log('space', space);
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
      data: {
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
          reactions: space.reactions,
          createdBy: space.createdBy,
          createdAt: space.createdAt,
          totalPosts: space.totalPosts,
          totalMembers: space.totalMembers,
          rate: space.rate,
          tags: tags,
        },
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
    const { userId } = request.body;
    const { spaceId } = request.params;
    // const doc = await SpaceAndUserRelationship.findOne({space: spaceId})

    await SpaceAndUserRelationship.create({
      user: userId,
      space: request.params.spaceId,
      createdAt: new Date(),
      lastCheckedIn: new Date(),
    });
    // ここもalready joinedをつけないといかん。

    const space = await Space.findById(spaceId).populate([
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

    const tags = await Tag.find({ space: spaceId }).populate({
      path: 'icon',
      model: 'Icon',
    });

    response.status(201).json({
      data: {
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
          reactions: space.reactions,
          createdBy: space.createdBy,
          createdAt: space.createdAt,
          totalPosts: space.totalPosts,
          totalMembers: space.totalMembers,
          rate: space.rate,
          tags: tags,
        },
      },
      // tagsもfetchしてこんといかん。
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateSpaceCheckedInDate = async (request, response) => {
  try {
    const { spaceId, userId } = request.params;
    const spaceAndUserRelationship = await SpaceAndUserRelationship.findOne({
      user: userId,
      space: spaceId,
    });

    spaceAndUserRelationship.lastCheckedIn = new Date();
    spaceAndUserRelationship.save();

    response.status(200).json({
      message: 'success', // 何も返す必要はないかな。
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSpaceBySecretKey = async (request, response) => {
  try {
    const { secretKey } = request.params;
    const space = await Space.findOne({ secretKey }).populate([
      {
        path: 'createdBy',
        model: 'User',
      },
    ]);
    console.log('got space!!', space);
    if (!space) {
      throw new Error('Space not found.');
    } else {
      response.status(200).json({
        data: {
          space,
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
};
