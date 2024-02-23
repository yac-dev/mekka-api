import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: function (request, file, callback) {
    const __dirname = path.resolve();
    const destination = path.join(__dirname, 'buffer');
    callback(null, destination); // 第一引数はpotential errorのこと。nullでいい。./uploadsは相対パス。
  },
  // これ、uuidも必要だな。
  filename: function (request, file, callback) {
    // call backでfilenameしか次に送ってないけど、ここを改善すべきなんだろう。。。
    let extension = file.mimetype === 'image/jpeg' ? 'png' : 'mp4'; // 写真の時、.jpg.pngってなっている。まあ最初はjpgだけでいいかも。videoの時もmov.mp4になっている。変えないといかん。
    // const fileName = request.body.createdBy + '-' + uuidv4() + '-' + Date.now() + '.' + extension;
    // const fileName = file.originalname + '.' + extension;
    // console.log(fileName);
    callback(null, file.originalname); //
  },
});

const multerParser = multer({ storage });
export default multerParser;
