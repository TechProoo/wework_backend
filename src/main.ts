import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// cookie-parser v1 exports a CommonJS function. Use require() to ensure runtime import
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // parse cookies so req.cookies is available to strategies and guards
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:5173', // Your Vite frontend URL
    credentials: true,
    exposedHeaders: ['Authorization'], // 👈 THIS allows frontend to read Authorization header
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
