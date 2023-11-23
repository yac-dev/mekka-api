import express from 'express';
const router = express.Router();
import { getMySpaces } from '../controllers/spaceAndUserRelationships.js';

router.route('/users/:userId').get(getMySpaces);

export default router;
