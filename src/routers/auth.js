import express from 'express';
const router = express.Router();
import { signup, loadMe, login, deleteMe, registerPushToken } from '../controllers/auth.js';
import { authorization } from '../middlewares/authorization.js';

router.route('/signup').post(signup);
router.route('/login').post(login);
router.get('/loadme', authorization, loadMe);
router.route('/:userId').delete(deleteMe);
router.route('/:userId/pushToken').patch(registerPushToken);

export default router;
