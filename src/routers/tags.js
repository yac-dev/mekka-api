import express from 'express';
const router = express.Router();
import { getPostsByTagId } from '../controllers/tags.js';

router.route('/:tagId/posts').get(getPostsByTagId);

export default router;
