import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with a safe allowlist and explicit preflight handling.
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://weworkk-delta.vercel.app', // Vercel production deployment
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('CORS: blocked origin', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    credentials: true,
    optionsSuccessStatus: 200,
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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
