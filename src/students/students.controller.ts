import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Patch,
  Res,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { LoginStudentDto } from './dto/login-student.dto';
import { Public } from '../decorators/public.decorator';
// import { LocalAuthGuard } from './guards/local-auth.guard';
import { SignupResponse } from './interfaces/students.auth';
import type { Response } from 'express';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<SignupResponse> {
    const student = await this.studentsService.signUp(createStudentDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Student account created successfully',
      data: student,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginStudentDto: LoginStudentDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.studentsService.login(loginStudentDto);

    // Set HttpOnly cookie with the access token. This prevents JS access to the token.
    // Use secure flag in production (when behind HTTPS).
    res.cookie('accessToken', token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: token.data,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the cookie on logout
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'lax' });
    return { message: 'Logout successful' };
  }

  @Get('profile')
  getProfile(@Request() req: { user: any }): any {
    return req.user;
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: { user: any },
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    const updatedStudent = await this.studentsService.updateProfile(
      req.user.id,
      updateStudentDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: updatedStudent,
    };
  }
}
