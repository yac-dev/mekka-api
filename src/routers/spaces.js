import express from 'express';
const router = express.Router();
import {
  createSpace,
  getSpaces,
  getSpaceById,
  getPostsBySpaceId,
  getPostsBySpaceIdAndYearAndMonth,
  getTagsBySpaceId,
  getLocationTagsBySpaceId,
  getPeopleBySpaceId,
  joinPrivateSpaceBySecretKey,
  joinPublicSpace,
} from '../controllers/spaces.js';
import multerParser from '../middlewares/multer.js';

router.route('/').post(multerParser.single('icon'), createSpace).get(getSpaces);
router.route('/:spaceId').get(getSpaceById);
router.route('/:spaceId/posts').get(getPostsBySpaceId);
router.route('/:spaceId/posts/:yearAndMonth').get(getPostsBySpaceIdAndYearAndMonth);
router.route('/:spaceId/tags').get(getTagsBySpaceId);
router.route('/:spaceId/people').get(getPeopleBySpaceId);
router.route('/:spaceId/locationtags').get(getLocationTagsBySpaceId);
router.route('/:spaceId/public').post(joinPublicSpace);
router.route('/private').post(joinPrivateSpaceBySecretKey);
// router.route('/:spaceId/posts'); //ここで、tagのidがっていうfilterをつけるかね？

export default router;
