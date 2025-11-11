import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
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
  @ValidateIf((o) => o.website !== '' && o.website !== null && o.website !== undefined)
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contactPersonName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  // Optional confirmPassword - backend will validate if present
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}
