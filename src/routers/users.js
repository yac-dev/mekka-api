import express from 'express';
const router = express.Router();
import { getUsersBySpaceId, getUsersByAddress } from '../controllers/users.js';
import { updateSpaceLastCheckedIn } from '../controllers/spaceAndUserRelationships.js';

router.route('/:spaceId/space').get(getUsersBySpaceId);
router.route('/:userId/lastcheckedin').patch(updateSpaceLastCheckedIn);
router.route('/').get(getUsersByAddress);

export default router;
