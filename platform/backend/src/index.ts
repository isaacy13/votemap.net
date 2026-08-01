import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';
import { createServer } from 'http';
import { loadEnv } from './config/env';
import { createAuthRouter } from './routes/auth';
import { createOutcomesRouter } from './routes/outcomes';
import { createEntitiesRouter } from './routes/entities';
import { createLedgerRouter } from './routes/ledger';
import { createVoteSessionsRouter } from './routes/voteSessions';
import { createHealthRouter } from './routes/health';
import { startExpireStakesJob } from './jobs/expireStakes';

async function main() {
  const env = loadEnv();
  const prisma = new PrismaClient();
  const app = express();
  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] },
    path: '/socket',
  });

  if (env.REDIS_URL && env.NODE_ENV === 'production') {
    try {
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const { default: Redis } = await import('ioredis');
      const pubClient = new Redis(env.REDIS_URL);
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.io Redis adapter connected');
    } catch (error) {
      console.warn('Redis adapter unavailable, using in-memory adapter:', error);
    }
  }

  io.on('connection', (socket) => {
    socket.on('join-outcome', (outcomeId: string) => {
      socket.join(`/outcome/${outcomeId}`);
    });
    socket.on('leave-outcome', (outcomeId: string) => {
      socket.leave(`/outcome/${outcomeId}`);
    });
    socket.on('join-vote-session', (sessionId: string) => {
      socket.join(`/vote-session/${sessionId}`);
    });
    socket.on('leave-vote-session', (sessionId: string) => {
      socket.leave(`/vote-session/${sessionId}`);
    });
    socket.on('join-entity', (entityId: string) => {
      socket.join(`/entity/${entityId}`);
    });
  });

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/auth', createAuthRouter(prisma, env));
  app.use('/outcomes', createOutcomesRouter(prisma, env.JWT_SECRET, io));
  app.use('/entities', createEntitiesRouter(prisma, env.JWT_SECRET, io));
  app.use('/ledger', createLedgerRouter(prisma));
  app.use('/vote-sessions', createVoteSessionsRouter(prisma, env, env.JWT_SECRET, io));
  app.use('/health', createHealthRouter(prisma, env));

  const expireTimer = startExpireStakesJob(prisma, io, 60_000);

  httpServer.listen(env.PORT, () => {
    console.log(`Votemap backend running on port ${env.PORT}`);
  });

  const shutdown = async () => {
    console.log('Shutting down...');
    clearInterval(expireTimer);
    await prisma.$disconnect();
    httpServer.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
