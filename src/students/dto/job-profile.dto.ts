import { IsString, IsOptional, IsArray } from 'class-validator';

export class JobProfileDto {
  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  resumeUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}
