import express from 'express';
const router = express.Router();
import { getUsersBySpaceId, getUsersByAddress, getUserById } from '../controllers/users.js';
import { updateSpaceLastCheckedIn } from '../controllers/spaceAndUserRelationships.js';

router.route('/:spaceId/space').get(getUsersBySpaceId);
router.route('/:userId/lastcheckedin').patch(updateSpaceLastCheckedIn);
router.route('/:userId').get(getUserById);
router.route('/').get(getUsersByAddress);

export default router;
