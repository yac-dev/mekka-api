import express from 'express';
const router = express.Router();
import { signup, loadMe, login } from '../controllers/auth';
import { authorization } from '../middlewares/authorization';

router.route('/signup').post(signup);
router.route('/login').post(login);
router.get('/loadme', authorization, loadMe);

export default router;
