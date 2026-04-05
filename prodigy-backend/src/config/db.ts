import { PrismaClient } from '@prisma/client';
import { isDev } from './env';

// Singleton pattern — ensures only one PrismaClient exists
// across the entire app lifecycle
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: isDev ? ['query', 'error', 'warn'] : ['error'],
    });

if (isDev) {
    globalForPrisma.prisma = prisma;
}

export default prisma;