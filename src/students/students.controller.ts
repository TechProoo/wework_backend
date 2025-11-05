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
  Param,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { LoginStudentDto } from './dto/login-student.dto';
import { Public } from '../decorators/public.decorator';
// import { LocalAuthGuard } from './guards/local-auth.guard';
import { SignupResponse } from './interfaces/students.auth';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

    // Debug: log a short prefix of the token being issued so we can trace
    // whether the same token gets sent back in subsequent requests.
    try {
      const preview =
        typeof token.access_token === 'string'
          ? token.access_token.slice(0, 40) + '...'
          : String(token.access_token);
      console.log('[students.controller] issuing access token:', preview);
    } catch (err) {
      console.error('[students.controller] token preview error', err);
    }

    // Set HttpOnly cookie with the access token. This prevents JS access to the token.
    // For cross-origin scenarios (Vercel frontend → Render backend), we need:
    // - secure: true (HTTPS only, required for sameSite: 'none')
    // - sameSite: 'none' (allow cross-site cookies between different domains)
    // These settings MUST match on both login and logout for the cookie to work properly
    res.cookie('accessToken', token.access_token, {
      httpOnly: true,
      secure: true, // Always use secure for deployed apps (HTTPS required)
      sameSite: 'none', // Always allow cross-site for Vercel → Render
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/', // Available across all paths
    });

    console.log('[students.controller] cookie set with settings:', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    // Debug: log the Set-Cookie header that will be sent
    const setCookieHeader = res.getHeader('Set-Cookie');
    console.log('[students.controller] Set-Cookie header:', setCookieHeader);

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: token.data,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the cookie on logout - must match the settings used when setting it
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true, // Must match login cookie settings
      sameSite: 'none', // Must match login cookie settings
      path: '/',
    });

    console.log('[students.controller] cookie cleared');
    return { message: 'Logout successful' };
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return {
      statusCode: 200,
      message: 'Profile fetched successfully',
      data: req.user,
    };
  }

  @Public()
  @Public()
  @Get()
  async findAll() {
    const data = await this.studentsService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Students retrieved',
      data,
    };
  }

  @Public()
  @Public()
  @Get('count')
  async getTotalUsers() {
    const total = await this.studentsService.getTotalUsers();
    return {
      statusCode: HttpStatus.OK,
      message: 'Total students fetched successfully',
      data: { total },
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.studentsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Student retrieved',
      data,
    };
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
