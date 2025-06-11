import express from 'express';
const router = express.Router();
import { createComment, getComments, getReplies } from '../controllers/comments.js';

router.route('/').post(createComment);
router.route('/post/:postId').get(getComments);
router.route('/:commentId/replies').get(getReplies);

export default router;
