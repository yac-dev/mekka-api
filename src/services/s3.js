import fs from 'fs';
import util from 'util';
const unlinkFile = util.promisify(fs.unlink);
import { Upload } from '@aws-sdk/lib-storage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

export const uploadAsset = async (buffer, mimeType, contentType) => {
  const assetName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

  const keyPrefixMap = {
    icon: 'icons',
    photo: 'photos',
    video: 'videos',
  };

  const Key = `${keyPrefixMap[contentType]}/${assetName()}`;

  const params = {
    Bucket: bucketName,
    Key,
    Body: buffer,
    ContentType: mimeType,
  };
  const command = new PutObjectCommand(params);
  await s3.send(command);
};

export const uploadPhoto = async (originalFileName, outputFileName, contentType, binaryData) => {
  const __dirname = path.resolve();
  const originalFilePath = path.join(__dirname, 'buffer', originalFileName);
  // const fileStream = fs.createReadStream(filePath);

  let Key;
  if (contentType === 'icon') {
    Key = `icons/${outputFileName}`;
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
export const uploadContentToS3 = async (originalFileName, outputFileName, contentType, binaryData) => {
  const __dirname = path.resolve();
  const originalFilePath = path.join(__dirname, 'buffer', originalFileName);
  // const fileStream = fs.createReadStream(filePath);

  let Key;
  if (contentType === 'icon') {
    Key = `icons/${outputFileName}`;
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
