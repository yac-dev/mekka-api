import express from 'express';
const router = express.Router();
import {
  createFollowingRelationship,
  getFollowingUsersByUserId,
  deleteFollowingRelationship,
} from '../controllers/followingRelationships.js';

router.route('/').post(createFollowingRelationship);
router.route('/').delete(deleteFollowingRelationship);
router.route('/users/:userId').get(getFollowingUsersByUserId);
export default router;
