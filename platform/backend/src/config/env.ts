import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(604800),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().default('votemap-proofs'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  SOLANA_RPC_URL: z.string().default('https://api.devnet.solana.com'),
  CORS_ORIGIN: z.string().default('*'),
  ZKPASSPORT_DOMAIN: z.string().default('localhost'),
  ZKPASSPORT_DEV_MODE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  VOTE_SESSION_TTL_SEC: z.coerce.number().default(120),
  GOOGLE_CLIENT_IDS: z.string().optional(), // comma-separated
  ALLOW_DEV_LOGIN: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return result.data;
}
