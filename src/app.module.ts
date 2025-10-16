import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StudentsModule } from './students/students.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './students/guards/jwt-auth.guard';
import { CompaniesModule } from './companies/companies.module';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [StudentsModule, CompaniesModule, CoursesModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
