import fs from 'fs';
import util from 'util';
const unlinkFile = util.promisify(fs.unlink);
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import path from 'path';

const s3 = new S3({
  region: process.env.AWS_S3_BUCKET_REGION,

  credentials: {
    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
  },
});

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
