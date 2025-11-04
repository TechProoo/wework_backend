import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Parse cookies so Passport can read the HttpOnly accessToken cookie
  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:5173', 'https://weworkk.netlify.app/'],
    credentials: true,
  });

  // Simple request logger to verify incoming requests reach the server.
  // Logs method, url and whether a Cookie header is present (does NOT log token values).
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
