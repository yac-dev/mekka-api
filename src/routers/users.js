import express from 'express';
const router = express.Router();
import {
  getUsersBySpaceId,
  getUsersByAddress,
  getUserById,
  getSpacesByUserId,
  getNotificationsByUserId,
} from '../controllers/users.js';
import { updateSpaceLastCheckedIn } from '../controllers/spaceAndUserRelationships.js';

router.route('/:userId/spaces').get(getSpacesByUserId);
router.route('/:userId/notifications').get(getNotificationsByUserId);

router.route('/:spaceId/space').get(getUsersBySpaceId);
router.route('/:userId/lastcheckedin').patch(updateSpaceLastCheckedIn);
router.route('/:userId').get(getUserById);
router.route('/').get(getUsersByAddress);
export default router;
