import Moment from '../models/moment';
import Content from '../models/content';
import mongoose from 'mongoose';
import { uploadPhoto } from '../services/s3';

export const createMoment = async (request, response) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { createdBy, disappearAfter, spaceId } = request.body;
    const createdAt = new Date();

    const disappearAt = new Date(createdAt.getTime() + Number(disappearAfter) * 60 * 1000);
    const files = request.files;
    // const contentIds = [];
    const contents = [];

    const contentPromises = files.map(async (file) => {
      // const contentId = new mongoose.Types.ObjectId();
      // contentIds.push(contentId);
      const content = await Content.create({
        // _id: contentId,
        data: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/${
          file.mimetype === 'image/jpeg' ? 'photos' : 'videos'
        }/${file.filename}`,
        type: file.mimetype === 'image/jpeg' ? 'photo' : 'video',
        createdBy,
        createdAt,
      });
      contents.push(content);
      await uploadPhoto(file.filename, content.type);
      return content;
    });

    const contentDocuments = await Promise.all(contentPromises);
    const contentIds = contentDocuments.map((content) => {
      return content._id;
    });
    // var momentId = new mongoose.Types.ObjectId();
    const moment = await Moment.create({
      contents: contentIds,
      space: spaceId,
      disappearAt,
      createdBy,
      createdAt,
    });

    response.status(201).json({
      moment: {
        _id: moment._id,
        content: {
          data: contents[0].data,
          type: contents[0].type,
        },
      },
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
