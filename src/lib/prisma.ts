import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma_client/client'

declare global {
  var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = global.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export default prisma;
