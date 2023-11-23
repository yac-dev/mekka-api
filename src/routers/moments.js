import express from 'express';
const router = express.Router();
import multerParser from '../middlewares/multer.js';
import { createMoment, getMomentsBySpaceId } from '../controllers/moments.js';

router.route('/').post(multerParser.array('contents', 10), createMoment);
// router.route('/:momentoId').get(getPost);
router.route('/:spaceId').get(getMomentsBySpaceId);

export default router;
