import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { JobStatus } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  remote?: boolean;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsString()
  @IsOptional()
  salaryRange?: string;

  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}
