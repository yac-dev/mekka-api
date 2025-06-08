import express from 'express';
const router = express.Router();
import { createComment, getComments } from '../controllers/comments.js';
import { createReply, getReplies } from '../controllers/replies.js';

router.route('/').post(createComment);
router.route('/post/:postId').get(getComments);
router.route('/:commentId/replies').get(getReplies).post(createReply);

export default router;
