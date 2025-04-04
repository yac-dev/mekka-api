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
  getMomentPostsBySpaceId,
  getReactionsByPostId,
  createReaction,
  getPostsByUserIdAndRegion,
} from '../controllers/posts.js';
import { multerParserInMemory } from '../middlewares/multerMemory.js';

router.route('/').post(multerParser.array('bufferContents', 10), createPost);
router.route('/moment').post(multerParser.array('bufferContents', 10), createMoment);
// multi-partのkey名はclient側のnameと必ず一致していること。
router.route('/:postId').get(getPost);
router.route('/:postId/comments').get(getCommentsByPostId);
router.route('/:postId/reactions').post(createReaction);
router.route('/:postId/reactions/:spaceId').post(getReactionsByPostId);
// router.route('/:postId/push-notifications').get(sendPostPushNotification);

router.route('/tag/:tagId').get(getPostsByTagId);
router.route('/tag/:tagId/region').post(getPostsByTagIdAndRegion);
router.route('/locationtag/:locationTagId/space/:spaceId').get(getPostsByLocationTagId);
router.route('/user/:userId/space/:spaceId').get(getPostsByUserId);
router.route('/space/:spaceId/moments').get(getMomentPostsBySpaceId);
router.route('/user/:userId/space/:spaceId/region').get(getPostsByUserIdAndRegion);

// routingがおかしい。
export default router;
