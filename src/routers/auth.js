import express from 'express';
const router = express.Router();
import {
  signup,
  loadMe,
  login,
  deleteMe,
  registerPushToken,
  forgotPassword,
  checkPINcode,
} from '../controllers/auth.js';
import { authorization } from '../middlewares/authorization.js';

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/forgotPassword').post(forgotPassword);
router.route('/checkpin').post(checkPINcode);
router.get('/loadme', authorization, loadMe);
router.route('/').delete(deleteMe);
router.route('/:userId/pushToken').patch(registerPushToken);

export default router;
