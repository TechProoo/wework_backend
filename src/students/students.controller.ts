import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { LoginStudentDto } from './dto/login-student.dto';
import { Public } from '../decorators/public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SignupResponse } from './interfaces/students.auth';

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
  async login(@Body() loginStudentDto: LoginStudentDto) {
    const token = await this.studentsService.login(loginStudentDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: token,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/logout')
  logout(@Request() req: { logout: () => void }): { message: string } {
    req.logout();
    return { message: 'Logout successful' };
  }

  @Get('profile')
  getProfile(@Request() req: { user: any }): any {
    return req.user;
  }
}
