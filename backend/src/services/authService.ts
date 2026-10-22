import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { conflict, unauthorized } from '../utils/errors';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}

export const register = async (data: RegisterData) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw conflict('EMAIL_TAKEN', 'Email sudah terdaftar');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: 'CUSTOMER',
      profile: {
        create: {
          fullName: data.fullName,
          phone: data.phone,
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      profile: true,
    },
  });

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as unknown as number,
    }
  );

  return { user, token };
};

export const login = async (data: LoginData) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { profile: true },
  });

  if (!user) {
    throw unauthorized('INVALID_CREDENTIALS', 'Email atau password salah');
  }

  if (!user.isActive) {
    throw unauthorized('USER_INACTIVE', 'Akun tidak aktif');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw unauthorized('INVALID_CREDENTIALS', 'Email atau password salah');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as unknown as number,
    }
  );

  const { passwordHash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      profile: true,
    },
  });

  if (!user) {
    throw unauthorized('USER_NOT_FOUND', 'User tidak ditemukan');
  }

  return user;
};

export const updateProfile = async (userId: string, data: UpdateProfileData) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw unauthorized('USER_NOT_FOUND', 'User tidak ditemukan');
  }

  const updatedProfile = await prisma.userProfile.update({
    where: { userId },
    data: {
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
    },
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    profile: updatedProfile,
  };
};
