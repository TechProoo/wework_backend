import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsUrl,
  Matches,
} from 'class-validator';

/**
 * DTO for student sign-up. Fields are based on the Prisma `User` model
 * (student-relevant fields) in `prisma/schema.prisma`.
 */
export class CreateStudentDto {
  /** Unique email for the user (required) */
  @IsEmail()
  email: string;

  /** Plain-text password provided at sign-up (required) */
  @IsString()
  @MinLength(6)
  password: string;

  /** Optional first name */
  @IsOptional()
  @IsString()
  firstName?: string;

  /** Optional last name */
  @IsOptional()
  @IsString()
  lastName?: string;

  /** Optional avatar URL */
  @IsOptional()
  @IsUrl()
  avatar?: string;

  /** Optional short bio */
  @IsOptional()
  @IsString()
  bio?: string;

  /** Student-specific fields */
  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  major?: string;

  /**
   * Graduation year as a 4-digit string (e.g. "2026").
   */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  graduationYear?: string;
}
