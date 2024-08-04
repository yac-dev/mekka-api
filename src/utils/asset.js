import sharp from 'sharp';

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

export const experimentVideo = async (request, response) => {
  try {
    console.log(request.body);
    // const { videoFileName, thumbnailFileName } = await optimizeVideoNew(request.files[0]);
    // console.log('optimized video -> ', videoFileName);
    // console.log('optimized thumbnail -> ', thumbnailFileName);

    response.status(201).json({
      message: 'success',
    });
  } catch (error) {
    console.log(error);
  }
};
