import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configurar pool de conexões limitado
const databaseUrl = process.env.DATABASE_URL || '';
const pooledUrl = databaseUrl.includes('?') 
  ? `${databaseUrl}&connection_limit=5&pool_timeout=10`
  : `${databaseUrl}?connection_limit=5&pool_timeout=10`;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: pooledUrl,
    },
  },
})

// Sempre manter o singleton para evitar muitas conexões
globalForPrisma.prisma = prisma
