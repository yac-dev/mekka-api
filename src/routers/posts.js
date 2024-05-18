import express from 'express';
const router = express.Router();
import multerParser from '../middlewares/multer.js';
import {
  createPost,
  createMoment,
  getPost,
  getPostsByTagId,
  getPostsByTagIdAndRegion,
  getPostsByUserId,
  getPostsByLocationTagId,
  getCommentsByPostId,
  experiment,
  getMomentPostsBySpaceId,
} from '../controllers/posts.js';

router.route('/').post(multerParser.array('bufferContents', 10), createPost);
router.route('/moment').post(multerParser.array('bufferContents', 10), createMoment);
router.route('/experiment').post(multerParser.single('experiment'), experiment);
router.route('/:postId').get(getPost);
router.route('/:postId/comments').get(getCommentsByPostId);
router.route('/tag/:tagId').get(getPostsByTagId);
router.route('/tag/:tagId/region').post(getPostsByTagIdAndRegion);
router.route('/locationtag/:locationTagId/space/:spaceId').get(getPostsByLocationTagId);
router.route('/user/:userId/space/:spaceId').get(getPostsByUserId);
router.route('/space/:spaceId/moments').get(getMomentPostsBySpaceId);

export default router;
