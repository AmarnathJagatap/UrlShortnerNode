import express from 'express';
import {
  createShortUrl,
  redirectShortUrl,
  getUrlAnalytics,
  getTopicAnalytics,
  getOverallAnalytics,
} from '../controllers/urlController.js'
import { protect } from '../middleware/authMiddleware.js';
import { createShortUrlLimiter } from '../middleware/rateLimiter.js';

const urlRouter = express.Router();

urlRouter.post('/shorten', protect, createShortUrlLimiter, createShortUrl);
urlRouter.get('/analytics/overall', protect, getOverallAnalytics);
urlRouter.get('/analytics/:alias', getUrlAnalytics);
urlRouter.get('/analytics/topic/:topic', getTopicAnalytics);

urlRouter.get('/:alias', redirectShortUrl);

export default urlRouter;
