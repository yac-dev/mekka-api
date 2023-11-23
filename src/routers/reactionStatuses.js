import express from 'express';
const router = express.Router();
import { getReactionStatuses } from '../controllers/reactionStatuses.js';

router.route('/post/:postId').get(getReactionStatuses);

export default router;
