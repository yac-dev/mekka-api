import express from 'express';
const router = express.Router();
import { getStickers, createSticker, createStickerPreview, deleteStickerPreview } from '../controllers/stickers';
import multerParser from '../middlewares/multer';

router.route('/').get(getStickers).post(createSticker);
router
  .route('/preview')
  .post(multerParser.single('originalStickerImage'), createStickerPreview)
  .patch(deleteStickerPreview);

export default router;
