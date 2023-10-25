import fs from 'fs';
import util from 'util';
const unlinkFile = util.promisify(fs.unlink);
import S3 from 'aws-sdk/clients/s3';
import path from 'path';

const s3 = new S3({
  region: process.env.AWS_S3_BUCKET_REGION,
  accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
  secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
});

export const uploadPhoto = async (fileName, contentType) => {
  const __dirname = path.resolve();
  const filePath = path.join(__dirname, 'buffer', fileName);
  const fileStream = fs.createReadStream(filePath);

  let Key;
  if (contentType === 'icon') {
    Key = `icons/${fileName}`;
  } else if (contentType === 'photo') {
    Key = `photos/${fileName}`;
  } else if (contentType === 'video') {
    Key = `videos/${fileName}`;
  }

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Body: fileStream,
    Key: Key,
  };
  await s3.upload(uploadParams).promise();
  console.log('content uploaded');

  await unlinkFile(filePath);
};
