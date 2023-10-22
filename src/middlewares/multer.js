import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ここもアレだな。。。
const storage = multer.diskStorage({
  destination: function (request, file, callback) {
    const __dirname = path.resolve();
    console.log(file);
    const destination = path.join(__dirname, 'buffer');
    callback(null, destination); // 第一引数はpotential errorのこと。nullでいい。./uploadsは相対パス。
  },
  // これ、uuidも必要だな。
  filename: function (request, file, callback) {
    console.log(file.mimetype);
    let extension = file.mimetype === 'image/jpeg' ? 'png' : 'mp4';
    // const fileName = request.body.createdBy + '-' + uuidv4() + '-' + Date.now() + '.' + extension;
    const fileName = file.originalname + '.' + extension;
    console.log(fileName);
    callback(null, fileName);
  },
});

const multerParser = multer({ storage });
export default multerParser;
