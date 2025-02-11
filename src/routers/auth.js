import express from 'express';
const router = express.Router();
import multerParser from '../middlewares/multer.js';

import {
  signup,
  loadMe,
  login,
  deleteMe,
  registerPushToken,
  forgotPassword,
  checkPINcode,
  updatePassword,
  updateMe,
} from '../controllers/auth.js';
import { authorization } from '../middlewares/authorization.js';

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/forgotPassword').post(forgotPassword);
router.route('/newpassword').post(updatePassword);
router.route('/checkpin').post(checkPINcode);
router.get('/loadme', authorization, loadMe);
router.route('/').delete(deleteMe);
router.route('/:userId/pushToken').patch(registerPushToken);
router.route('/:userId').patch(multerParser.single('avatar'), updateMe);

export default router;
