import { z } from 'zod';
import path from 'path';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().default('jalanyuk-dev-secret-ganti-di-produksi'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  C_DEMO_DIR: z.string().default(path.resolve(__dirname, '../../../algorithms-c')),
  C_DEMO_TIMEOUT_MS: z.coerce.number().default(5000),
});

export const env = envSchema.parse(process.env);
