import express from 'express';
const router = express.Router();
import { getReactionStatuses } from '../controllers/reactionStatuses';

router.route('/post/:postId').get(getReactionStatuses);

export default router;
