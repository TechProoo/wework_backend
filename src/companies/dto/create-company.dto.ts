import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  companyName: string;

  @IsEmail()
  email: string;

  // Plain password supplied by the client; the service should store a hashed value in the DB
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
