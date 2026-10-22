import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { unauthorized, forbidden } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        isActive: boolean;
      };
    }
  }
}

interface JWTPayload {
  sub: string;
  role: string;
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw unauthorized('TOKEN_MISSING', 'Token autentikasi tidak ditemukan');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw unauthorized('USER_NOT_FOUND', 'User tidak ditemukan');
    }

    if (!user.isActive) {
      throw unauthorized('USER_INACTIVE', 'Akun tidak aktif');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw unauthorized('INVALID_TOKEN', 'Token tidak valid');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw unauthorized('TOKEN_EXPIRED', 'Token telah kedaluwarsa');
    }
    throw error;
  }
});

export const requireAdmin = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw unauthorized('UNAUTHORIZED', 'Autentikasi diperlukan');
  }

  if (req.user.role !== 'ADMIN') {
    throw forbidden('ADMIN_ONLY', 'Akses hanya untuk admin');
  }

  next();
});
