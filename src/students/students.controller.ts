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

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('signup')
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.signUp(createStudentDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginStudentDto: LoginStudentDto) {
    return this.studentsService.signUp(loginStudentDto);
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
