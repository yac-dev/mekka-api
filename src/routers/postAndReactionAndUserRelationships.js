import express from 'express';
const router = express.Router();

import { getReactionsByPostId, createReaction } from '../controllers/postAndReactionAndUserRelationships.js';

router.route('/').post(createReaction);
router.route('/:postId').get(getReactionsByPostId);

export default router;
