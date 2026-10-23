import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Production DB lives in Neon Singapore while the API runs on Render in
    // another region — each query round trip is slow enough that Prisma's
    // default 5s interactive-transaction timeout killed booking creation
    // (P2028). Give transactions realistic headroom.
    transactionOptions: {
      maxWait: 10_000,
      timeout: 30_000,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
