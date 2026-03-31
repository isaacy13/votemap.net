import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';
import { createServer } from 'http';
import { loadEnv } from './config/env';
import { createAuthRouter } from './routes/auth';
import { createIssuesRouter } from './routes/issues';
import { createContributionsRouter } from './routes/contributions';
import { createResolutionRouter } from './routes/resolution';
import { createDeliverablesRouter } from './routes/deliverables';
import { createEntitiesRouter } from './routes/entities';
import { createHealthRouter } from './routes/health';

async function main() {
  const env = loadEnv();
  const prisma = new PrismaClient();
  const app = express();
  const httpServer = createServer(app);

  // Socket.io setup
  const io = new SocketServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] },
    path: '/socket',
  });

  // Optional Redis adapter for horizontal scaling
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

  // Socket.io connection handling
  io.on('connection', (socket) => {
    socket.on('join-issue', (issueId: string) => {
      socket.join(`/issue/${issueId}`);
    });
    socket.on('leave-issue', (issueId: string) => {
      socket.leave(`/issue/${issueId}`);
    });
  });

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Routes
  app.use('/auth', createAuthRouter(prisma, env.JWT_SECRET, env.JWT_EXPIRES_IN));
  app.use('/issues', createIssuesRouter(prisma, env.JWT_SECRET, io));
  app.use('/issues', createContributionsRouter(prisma, env.JWT_SECRET, io));
  app.use('/issues', createResolutionRouter(prisma, env.JWT_SECRET, io));
  app.use('/issues', createDeliverablesRouter(prisma, env.JWT_SECRET, io));
  app.use('/entities', createEntitiesRouter(prisma, env.JWT_SECRET, io));
  app.use('/health', createHealthRouter(prisma));

  // Start server
  httpServer.listen(env.PORT, () => {
    console.log(`Votemap backend running on port ${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
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
