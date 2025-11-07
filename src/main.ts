import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Log environment info for debugging
  console.log('=== BOOTSTRAP INFO ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'NOT SET');
  console.log('======================');

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
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
void bootstrap();
