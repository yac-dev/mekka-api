import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// これもういらなくね。。。memory storageあるから。
const storage = multer.diskStorage({
  destination: function (request, file, callback) {
    const __dirname = path.resolve();
    const destination = path.join(__dirname, 'buffer');
    callback(null, destination); // 第一引数はpotential errorのこと。nullでいい。./uploadsは相対パス。
  },
  // これ、uuidも必要だな。
  filename: function (request, file, callback) {
    callback(null, file.originalname); //
  },
});

const multerParser = multer({ storage });
export default multerParser;
