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
  UnauthorizedException,
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
    @Request() req: any,
  ) {
    // Log the origin of the request for debugging
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    console.log('[students.controller] Login request from origin:', origin);
    console.log('[students.controller] Request headers:', {
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent'],
    });

    const token = await this.studentsService.login(loginStudentDto);

    try {
      const preview =
        typeof token.access_token === 'string'
          ? token.access_token.slice(0, 40) + '...'
          : String(token.access_token);
      console.log('[students.controller] issuing access token:', preview);
    } catch (err) {
      console.error('[students.controller] token preview error', err);
    }

    // Set HttpOnly cookie with the access token
    res.cookie('accessToken', token.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Also set CORS headers explicitly in the response
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', origin);

    console.log('[students.controller] cookie set with settings:', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

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
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req: any) {
    try {
      console.log('[students.controller] getProfile called');
      console.log('[students.controller] req.user:', req.user ? 'present' : 'missing');
      
      if (!req.user) {
        console.error('[students.controller] getProfile: no user in request');
        throw new UnauthorizedException('User not authenticated');
      }

      console.log('[students.controller] getProfile: returning user profile for', req.user.email);
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Profile fetched successfully',
        data: req.user,
      };
    } catch (error) {
      console.error('[students.controller] getProfile error:', error);
      throw error;
    }
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
