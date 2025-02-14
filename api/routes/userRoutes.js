import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  createShortUrl,
  redirectShortUrl,
  getUrlAnalytics,
  getTopicAnalytics,
  getOverallAnalytics
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { createShortUrlLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/auth', authUser);
router.post('/logout', logoutUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/shorten', protect, createShortUrlLimiter, createShortUrl);
router.get('/analytics/overall', protect, getOverallAnalytics);
router.get('/analytics/:alias', getUrlAnalytics);
router.get('/analytics/topic/:topic', getTopicAnalytics);

router.get('/:alias', redirectShortUrl);

export default router;
