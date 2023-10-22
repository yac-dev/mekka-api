import express from 'express';
const router = express.Router();
import { createComment, getComments } from '../controllers/comments';

router.route('/').post(createComment);
router.route('/post/:postId').get(getComments);

export default router;
