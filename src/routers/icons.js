import express from 'express';
const router = express.Router();
import { getIconByName } from '../controllers/icons.js';

router.route('/').get(getIconByName);

export default router;
