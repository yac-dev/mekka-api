import express from 'express';
const router = express.Router();
import { createPostNotification } from '../controllers/notifications.js';

router.route('/').get(createPostNotification);

export default router;
