import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { CreateLessonDto } from './create-lesson.dto';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  // Level should be one of: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string;

  // duration in seconds (optional, will be computed from lessons if provided)
  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // optional lessons to create with the course
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons?: CreateLessonDto[];
}
