import express from 'express';
const router = express.Router();
import {
  getUsersBySpaceId,
  getUsersByAddress,
  getUserById,
  getSpacesByUserId,
  getNotificationsByUserId,
  readNotifications,
} from '../controllers/users.js';
import { updateSpaceLastCheckedIn } from '../controllers/spaceAndUserRelationships.js';

router.route('/:userId/spaces').get(getSpacesByUserId);
router.route('/:userId/notifications').get(getNotificationsByUserId);
// 個別のreadを後で実装するかもしれん。
router.route('/:userId/notifications').patch(readNotifications);

router.route('/:spaceId/space').get(getUsersBySpaceId);
router.route('/:userId/lastcheckedin').patch(updateSpaceLastCheckedIn);
router.route('/:userId').get(getUserById);
router.route('/').get(getUsersByAddress);
export default router;
