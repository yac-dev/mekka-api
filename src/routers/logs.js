import express from 'express';
const router = express.Router();
import { getSpaceUpdates } from '../controllers/logs.js';

router.route('/:userId').get(getSpaceUpdates);

export default router;
