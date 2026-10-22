import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/schemas';
import { register, login, getProfile, updateProfile } from '../services/authService';
import { ok, created } from '../utils/response';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
    },
  },
});

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await register(req.body);
    return created(res, user);
  })
);

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body);
    return ok(res, result);
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getProfile(req.user!.id);
    return ok(res, { user });
  })
);

router.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await updateProfile(req.user!.id, req.body);
    return ok(res, { user });
  })
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (_req, res) => {
    return ok(res, { message: 'Logout berhasil' });
  })
);

export default router;
