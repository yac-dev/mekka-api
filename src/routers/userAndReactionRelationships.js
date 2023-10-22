import express from 'express';
const router = express.Router();
import { createReaction, getUserReactions } from '../controllers/userAndReactionRelationships';

router.route('/user/:userId/post/:postId').post(createReaction);
router.route('/post/:postId').get(getUserReactions);

export default router;
