import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule], // 👈 add here
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
