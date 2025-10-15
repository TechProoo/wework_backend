import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

/**
 * DTO for student sign-up. Matches the `Student` Prisma model.
 */
export class CreateStudentDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  university: string;

  @IsString()
  major: string;

  /** Graduation year as a 4-digit string (e.g. "2026"). */
  @IsString()
  @Matches(/^\d{4}$/)
  graduationYear: string;
}
