import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { createPgPool, getPoolMetrics } from './pg-pool.js';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pool?: pg.Pool;
};

if (!globalForPrisma.pool) {
  globalForPrisma.pool = createPgPool();
}

// `@prisma/adapter-pg` pulls in its own copy of `@types/pg`, so its `pg.Pool`
// parameter type is structurally distinct from the one this module resolves
// even though both describe the same runtime class. Bridge the two nominal
// copies through `unknown`; the object handed over is the pool we created.
const adapter = new PrismaPg(
  globalForPrisma.pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { getPoolMetrics };
export const pool = globalForPrisma.pool!;

export default prisma;
