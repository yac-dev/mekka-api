import express from 'express';
const router = express.Router();
import { getFollowingRelationship, createFollowingRelationship } from '../controllers/followingRelationships.js';

router.route('/').post(createFollowingRelationship);

export default router;
