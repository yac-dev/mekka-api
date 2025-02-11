import fs from 'fs';
import util from 'util';
const unlinkFile = util.promisify(fs.unlink);
import { Upload } from '@aws-sdk/lib-storage';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const bucketRegion = process.env.AWS_S3_BUCKET_REGION;
const bucketAccessKey = process.env.AWS_S3_BUCKET_ACCESS_KEY;
const bucketSecretKey = process.env.AWS_S3_BUCKET_SECRET_KEY;

const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: bucketAccessKey,
    secretAccessKey: bucketSecretKey,
  },
});

export const uploadPhoto = async (originalFileName, outputFileName, contentType, binaryData) => {
  const __dirname = path.resolve();
  const originalFilePath = path.join(__dirname, 'buffer', originalFileName);
  // const fileStream = fs.createReadStream(filePath);

  let Key;
  if (contentType === 'icon') {
    Key = `icons/${outputFileName}`;
  } else if (contentType === 'avatar') {
    Key = `avatar/${outputFileName}`;
  } else if (contentType === 'photo') {
    Key = `photos/${outputFileName}`;
  } else if (contentType === 'video') {
    Key = `videos/${outputFileName}`;
  }

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Body: binaryData,
    Key: Key,
  };
  await new Upload({
    client: s3,
    params: uploadParams,
  }).done();
  console.log('content uploaded');

  await unlinkFile(originalFilePath);
};

// あくまで、s3へのuploadだけにしたいねここの役割は、ということで。、
export const uploadContentToS3 = async (outputFileName, type, binaryData) => {
  let Key = `${type}/${outputFileName}`;
  const uploadParams = {
    Bucket: bucketName,
    Body: binaryData,
    Key: Key,
  };
  await new Upload({
    client: s3,
    params: uploadParams,
  }).done();
  console.log('📀 content uploaded 📀');
};

export const deleteContentFromS3 = async (fileName, type) => {
  const Key = `${type}/${fileName}`;
  const deleteParams = {
    Bucket: bucketName,
    Key: Key,
  };

  try {
    await s3.send(new DeleteObjectCommand(deleteParams));
    console.log(`🗑️ content deleted: ${Key}`);
  } catch (error) {
    console.error(`Failed to delete content: ${Key}`, error);
  }
};

export const uploadIcon = async (fileName) => {
  const __dirname = path.resolve();
  const originalFilePath = path.join(__dirname, 'buffer', fileName);
  const fileStream = fs.createReadStream(originalFilePath);

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Body: fileStream,
    Key: `icons/${fileName}`,
  };

  await new Upload({
    client: s3,
    params: uploadParams,
  }).done();

  await unlinkFile(originalFilePath);
};

export const uploadVideo = async (inputFileName, contentType, binaryData) => {
  const __dirname = path.resolve();
  const inputFilePath = path.join(__dirname, 'buffer', inputFileName);
  const fileStream = fs.createReadStream(inputFilePath);

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Body: fileStream,
    Key: `videos/${inputFileName}`,
  };
  await new Upload({
    client: s3,
    params: uploadParams,
  }).done();
  console.log('content uploaded');

  await unlinkFile(inputFilePath);
};
