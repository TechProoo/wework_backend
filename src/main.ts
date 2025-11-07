import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Log environment info for debugging
  console.log('=== BOOTSTRAP INFO ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'NOT SET');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'NOT SET');
  console.log('======================');

  // Verify database connection at startup
  const prismaService = app.get(PrismaService);
  try {
    await prismaService.$connect();
    console.log('[Database] Connected to PostgreSQL successfully');
  } catch (error) {
    console.error('[Database] Failed to connect:', error);
    throw new Error('Database connection failed');
  }

  // Enhanced CORS configuration for cross-origin cookie support
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://weworkk-delta.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) {
        console.log('[CORS] Allowing request with no origin');
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log('[CORS] Allowing origin:', origin);
        callback(null, true);
      } else {
        console.warn('[CORS] Blocking origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Critical: allows cookies to be sent/received
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // Cache preflight for 24 hours
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });

  // Middleware
  app.use(cookieParser());

  app.use((req, _res, next) => {
    try {
      const hasCookie = !!req.headers?.cookie;
      console.log(
        `HTTP ${req.method} ${req.url} - cookie-present=${hasCookie}`,
      );
    } catch (err) {
      console.log('request-logger error', err);
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT ?? 3000;
  // Railway requires listening on 0.0.0.0 (not localhost)
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port} (host: 0.0.0.0)`);

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}
void bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
