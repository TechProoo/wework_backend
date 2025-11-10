import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginCompanyDto } from './dto/login-company.dto';

@Injectable()
export class CompaniesService {
  private prisma = new PrismaClient();
  constructor(private jwtService: JwtService) {}

  async signUp(createCompanyDto: CreateCompanyDto) {
    let {
      email,
      companyName,
      password,
      confirmPassword,
      contactPersonName,
      phone,
      companySize,
      ...rest
    } = createCompanyDto as any;
    email = String(email).trim().toLowerCase();

    // Check if email already exists
    const existingUser = await this.prisma.company.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Validate confirmPassword if provided
    if (confirmPassword !== undefined && confirmPassword !== password) {
      throw new UnauthorizedException('Passwords do not match');
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create the company and store passwordHash
    const createData: any = {
      companyName,
      email,
      passwordHash: hashed,
      contactPersonName: contactPersonName ?? null,
      phone: phone ?? null,
      companySize: companySize ?? null,
      industry: rest.industry ?? null,
      website: rest.website ?? null,
      description: rest.description ?? null,
    };

    const created = await this.prisma.company.create({
      data: createData,
    });

    const { passwordHash, ...safeCompany } = created;

    return safeCompany;
  }

  async validateUser(email: string, password: string) {
    email = String(email).trim().toLowerCase();
    const company = await this.prisma.company.findUnique({ where: { email } });
    if (!company) return null;

    const ok = await bcrypt.compare(password, company.passwordHash);
    if (!ok) return null;

    const { passwordHash, ...safeCompany } = company;
    return safeCompany;
  }

  async login(loginCompanyDto: LoginCompanyDto) {
    let { email, password } = loginCompanyDto;
    email = String(email).trim().toLowerCase();

    const company = await this.prisma.company.findUnique({ where: { email } });
    if (!company) {
      console.log('Company not found with email:', email);
      throw new UnauthorizedException('Invalid email');
    }

    const ok = await bcrypt.compare(password, company.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid password');

    const { passwordHash, ...safeCompany } = company;

    const access_token = await this.jwtService.signAsync(safeCompany);
    return {
      access_token: access_token,
      data: safeCompany,
    };
  }

  async findAll() {
    const companies = await this.prisma.company.findMany({
      select: {
        id: true,
        companyName: true,
        email: true,
        industry: true,
        contactPersonName: true,
        phone: true,
        companySize: true,
        website: true,
        description: true,
        createdAt: true,
        _count: {
          select: { jobs: true },
        },
      } as any,
    });
    return companies;
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        email: true,
        industry: true,
        contactPersonName: true,
        phone: true,
        companySize: true,
        website: true,
        description: true,
        createdAt: true,
        jobs: {
          orderBy: { createdAt: 'desc' },
        },
      } as any,
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async updateProfile(id: string, updateCompanyDto: UpdateCompanyDto) {
    const { password, ...rest } = updateCompanyDto;

    const updateData: any = { ...rest };

    // If password is being updated, hash it
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
      const updated = await this.prisma.company.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          companyName: true,
          email: true,
          industry: true,
          website: true,
          description: true,
          createdAt: true,
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Company with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Email or company name already in use');
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.company.delete({
        where: { id },
      });
      return { message: 'Company deleted successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Company with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  // =====================
  // JOB MANAGEMENT
  // =====================

  async createJob(companyId: string, createJobDto: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: {
        ...createJobDto,
        companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
          },
        },
      },
    });

    return job;
  }

  async findAllJobs(filters?: {
    companyId?: string;
    status?: string;
    remote?: boolean;
  }) {
    const where: any = {};

    if (filters?.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.remote !== undefined) {
      where.remote = filters.remote;
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            website: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs;
  }

  async findOneJob(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            website: true,
            description: true,
          },
        },
        applications: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                university: true,
                major: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    return job;
  }

  async updateJob(
    jobId: string,
    companyId: string,
    updateJobDto: UpdateJobDto,
  ) {
    // First check if job exists and belongs to company
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.companyId !== companyId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: updateJobDto,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return updated;
  }

  async removeJob(jobId: string, companyId: string) {
    // First check if job exists and belongs to company
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.companyId !== companyId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.prisma.job.delete({
      where: { id: jobId },
    });

    return { message: 'Job deleted successfully' };
  }

  async getJobApplications(jobId: string, companyId: string) {
    // First check if job exists and belongs to company
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { companyId: true },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.companyId !== companyId) {
      throw new ForbiddenException(
        'You can only view applications for your own jobs',
      );
    }

    const applications = await this.prisma.application.findMany({
      where: { jobId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            university: true,
            major: true,
            graduationYear: true,
            xp: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  }

  async getTotalCompanies(): Promise<number> {
    return await this.prisma.company.count();
  }
}
