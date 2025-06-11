import express from 'express';
const router = express.Router();
import { createReply } from '../controllers/replies.js';

router.route('/').post(createReply);

export default router;
