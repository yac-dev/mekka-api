import Sticker from '../models/sticker.js';
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { removeBackground } from '@imgly/background-removal-node';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import util from 'util';
const unlinkFile = util.promisify(fs.unlink);

const s3 = new S3({
  region: process.env.AWS_S3_BUCKET_REGION,

  credentials: {
    // このexpress appのbucketにアクセスするためのunique name。
    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,

    // そして、それのpassword。
    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_KEY,
  },
});

export const getStickers = async (request, response) => {
  try {
    const stickers = await Sticker.find({ isPublic: true });
    response.status(200).json({
      stickers,
    });
  } catch (error) {
    console.log(error);
  }
};

const executeRemoveBg = async (inputFilePath, fileName) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, '..', '..', 'buffer', `removed-${fileName}`);
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', fs.createReadStream(inputFilePath), path.basename(inputFilePath));
    axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: formData,
      responseType: 'arraybuffer',
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': process.env.REMOVEBG_API_KEY,
      },
      encoding: null,
    })
      .then((response) => {
        if (response.status != 200) return console.error('Error:', response.status, response.statusText);
        fs.writeFileSync(outputPath, response.data);
        unlinkFile(inputFilePath);
        resolve('success');
      })
      .catch((error) => {
        return console.error('Request failed:', error);
      });
  });
};

export const createStickerPreview = async (request, response) => {
  try {
    // 今回はfile deleteね。
    if (request.body.exFileName) {
      await unlinkFile(path.join(__dirname, '..', '..', 'buffer', `removed-${request.body.exFileName}`));
    }
    const inpuFilePath = path.join(__dirname, '..', '..', 'buffer', request.file.filename);
    const res1 = await executeRemoveBg(inpuFilePath, request.file.filename);
    response.status(200).json({
      message: 'success',
    });
  } catch (error) {
    console.log(error);
  }
};

export const deleteStickerPreview = async (request, response) => {
  try {
    console.log(request.body);
    await unlinkFile(path.join(__dirname, '..', '..', 'buffer', `removed-${request.body.fileName}`));
    response.status(200).json({
      message: 'success',
    });
  } catch (error) {
    console.log(error);
  }
};

export const createSticker = async (request, response) => {
  try {
    const imagePath = path.join(__dirname, '..', '..', 'buffer', `removed-${request.body.fileName}`);
    const fileStream = fs.createReadStream(imagePath);

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Body: fileStream,
      Key: `stickers/removed-${request.body.fileName}`,
    };
    await new Upload({
      client: s3,
      params: uploadParams,
    }).done();
    await unlinkFile(imagePath);
    const sticker = await Sticker.create({
      url: `https://mekka-${process.env.NODE_ENV}.s3.us-east-2.amazonaws.com/stickers/removed-${request.body.fileName}`,
      name: `removed-${request.body.fileName}`,
      createdBy: request.body.userId,
      isPublic: false,
    });
    response.status(200).json({
      sticker,
    });
  } catch (error) {
    console.log(error);
  }
};

// sticker create時はsharpしたいね。実装複雑になるけど。
export const createStickerAndPreview = async (request, response) => {
  // multerで受け取ったファイルをバッファに保存する。
  const imagePath = path.join(path.resolve(), 'buffer', request.file.filename);
  let config = {
    output: {
      format: 'image/webp',
      quality: 0.8, // The quality. (Default: 0.8)
      type: 'foreground',
    },
  };

  try {
    const blob = await removeBackground(imagePath, config);
    const buffer = Buffer.from(await blob.arrayBuffer());

    // // Define the output path for the new image
    // const outputFilePath = path.join(path.resolve(), 'buffer', `processed-${request.file.filename}`);

    // // Write the buffer to a file
    // fs.writeFileSync(outputFilePath, buffer);
    const base64Image = buffer.toString('base64');
    unlinkFile(imagePath);
    // clientにbase64 dataだけを返す。

    response.status(200).json({
      data: {
        image: `data:image/webp;base64,${base64Image}`,
      },
    });
  } catch (error) {
    console.error('Error during background removal:', error);
    response.status(500).json({
      message: 'Failed to process image',
    });
  }
};
