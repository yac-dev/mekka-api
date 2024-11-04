import express from 'express';
const router = express.Router();
import {
  getStickers,
  createSticker,
  createStickerPreview,
  deleteStickerPreview,
  createStickerAndPreview,
} from '../controllers/stickers.js';
import multerParser from '../middlewares/multer.js';

router.route('/').get(getStickers).post(createSticker);
// router
//   .route('/preview')
//   .post(multerParser.single('originalStickerImage'), createStickerPreview)
//   .patch(deleteStickerPreview);
router.route('/preview').post(multerParser.single('originalStickerImage'), createStickerAndPreview);
export default router;
