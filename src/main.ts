import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS first
  app.enableCors({
    origin: ['http://localhost:5173', 'https://weworkk.netlify.app'],
    credentials: true,
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
