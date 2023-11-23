import express from 'express';
const router = express.Router();
import { getUsersBySpaceId } from '../controllers/users.js';

router.route('/:spaceId/space').get(getUsersBySpaceId);

export default router;
