import { rateLimit } from 'express-rate-limit'

const createShortUrlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Rate limit exceeded. Try again later.' },
  keyGenerator: (req) => req.user.email,
});

export { createShortUrlLimiter };