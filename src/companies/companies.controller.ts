import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Request,
  Patch,
  Delete,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Public } from '../decorators/public.decorator';
import { LoginCompanyDto } from './dto/login-company.dto';
import type { Response } from 'express';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // =====================
  // AUTH ENDPOINTS
  // =====================

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() createCompanyDto: CreateCompanyDto) {
    const company = await this.companiesService.signUp(createCompanyDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Company account created successfully',
      data: company,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginCompanyDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ) {
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    console.log('[companies.controller] Login request from origin:', origin);

    const result = await this.companiesService.login(loginDto);

    // Set HttpOnly cookie with the access token (same as students)
    res.cookie('accessToken', result.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', origin);

    console.log('[companies.controller] Login successful, cookie set');

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: result.data,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    console.log('[companies.controller] Logout successful, cookie cleared');

    return {
      statusCode: HttpStatus.OK,
      message: 'Logout successful',
    };
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req: any) {
    console.log('[companies.controller] getProfile called');

    if (!req.user) {
      throw new Error('User not authenticated');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Profile fetched successfully',
      data: req.user,
    };
  }

  // =====================
  // COMPANY CRUD
  // =====================

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    const companies = await this.companiesService.findAll();

    return {
      statusCode: HttpStatus.OK,
      message: 'Companies retrieved successfully',
      data: companies,
    };
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const company = await this.companiesService.findOne(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Company retrieved successfully',
      data: company,
    };
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: any,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const companyId = req.user.id;
    const updated = await this.companiesService.updateProfile(
      companyId,
      updateCompanyDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: updated,
    };
  }

  @Delete('profile')
  @HttpCode(HttpStatus.OK)
  async remove(@Request() req: any) {
    const companyId = req.user.id;
    const result = await this.companiesService.remove(companyId);

    return {
      statusCode: HttpStatus.OK,
      ...result,
    };
  }

  // =====================
  // JOB ENDPOINTS
  // =====================

  @Post('jobs')
  @HttpCode(HttpStatus.CREATED)
  async createJob(@Request() req: any, @Body() createJobDto: CreateJobDto) {
    const companyId = req.user.id;
    const job = await this.companiesService.createJob(companyId, createJobDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Job created successfully',
      data: job,
    };
  }

  @Public()
  @Get('jobs/all')
  @HttpCode(HttpStatus.OK)
  async findAllJobs(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('remote') remote?: string,
  ) {
    const filters: any = {};

    if (companyId) filters.companyId = companyId;
    if (status) filters.status = status;
    if (remote !== undefined) filters.remote = remote === 'true';

    const jobs = await this.companiesService.findAllJobs(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Jobs retrieved successfully',
      data: jobs,
    };
  }

  @Get('jobs/my-jobs')
  @HttpCode(HttpStatus.OK)
  async getMyJobs(@Request() req: any) {
    const companyId = req.user.id;
    const jobs = await this.companiesService.findAllJobs({ companyId });

    return {
      statusCode: HttpStatus.OK,
      message: 'Your jobs retrieved successfully',
      data: jobs,
    };
  }

  @Public()
  @Get('jobs/:id')
  @HttpCode(HttpStatus.OK)
  async findOneJob(@Param('id') id: string) {
    const job = await this.companiesService.findOneJob(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Job retrieved successfully',
      data: job,
    };
  }

  @Patch('jobs/:id')
  @HttpCode(HttpStatus.OK)
  async updateJob(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    const companyId = req.user.id;
    const updated = await this.companiesService.updateJob(
      id,
      companyId,
      updateJobDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Job updated successfully',
      data: updated,
    };
  }

  @Delete('jobs/:id')
  @HttpCode(HttpStatus.OK)
  async removeJob(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.id;
    const result = await this.companiesService.removeJob(id, companyId);

    return {
      statusCode: HttpStatus.OK,
      ...result,
    };
  }

  @Get('jobs/:id/applications')
  @HttpCode(HttpStatus.OK)
  async getJobApplications(@Param('id') jobId: string, @Request() req: any) {
    const companyId = req.user.id;
    const applications = await this.companiesService.getJobApplications(
      jobId,
      companyId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Applications retrieved successfully',
      data: applications,
    };
  }

  @Public()
  @Get('count')
  async getAllCompanies() {
    const total = await this.companiesService.getTotalCompanies();

    return {
      statusCode: HttpStatus.OK,
      message: 'Total students fetched successfully',
      data: { total },
    };
  }
}
