import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import searchRoutes from './routes/search';
import bookingsRoutes from './routes/bookings';
import adminRoutes from './routes/admin';
import algorithmLabRoutes from './routes/algorithmLab';
import { errorHandler } from './middleware/error';
import { notFound } from './utils/errors';

export const createApp = () => {
  const app = express();

  // Security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // CORS
  app.use(cors());

  // Body parser
  app.use(express.json());

  // Global rate limiter
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 300,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
      },
    },
  });
  app.use(globalLimiter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        service: 'JalanYuk API',
        time: new Date().toISOString(),
      },
    });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api', searchRoutes);
  app.use('/api', bookingsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/algorithm-lab', algorithmLabRoutes);

  // 404 handler
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(notFound('ROUTE_NOT_FOUND', 'Endpoint tidak ditemukan'));
  });

  // Error handler
  app.use(errorHandler);

  return app;
};

export default createApp();
