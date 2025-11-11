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

    // Check if email already exists. Use a minimal select to avoid
    // reading non-existent optional columns (which can throw P2022
    // if the DB schema hasn't been migrated yet).
    let existingUser: any = null;
    try {
      existingUser = await this.prisma.company.findUnique({
        where: { email },
        select: { id: true, email: true },
      });
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2022'
      ) {
        // If the DB is missing columns, assume user does not exist
        // and continue; we'll handle create similarly below.
        console.warn(
          '[companies.service] Prisma P2022 during signUp.findUnique - missing column(s), continuing without existingUser check',
          err.meta,
        );
        existingUser = null;
      } else {
        throw err;
      }
    }

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

    // Attempt to create with full data; if the DB is missing some
    // optional columns (P2022), retry with a reduced payload so
    // signup remains functional until migrations are applied.
    let created: any;
    try {
      created = await this.prisma.company.create({ data: createData });
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2022'
      ) {
        console.warn(
          '[companies.service] Prisma P2022 during signUp.create - retrying with reduced data',
          err.meta,
        );
        const fallbackData: any = {
          companyName,
          email,
          passwordHash: hashed,
        };

        try {
          created = await this.prisma.company.create({ data: fallbackData });
        } catch (err2: any) {
          // If fallback also fails, rethrow the original error if it's more informative
          if (err2 instanceof Prisma.PrismaClientKnownRequestError) {
            // map unique constraint to ConflictException for nicer API behavior
            if (err2.code === 'P2002') {
              throw new ConflictException(
                'Email or company name already in use',
              );
            }
          }
          throw err2;
        }
      } else if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email or company name already in use');
      } else {
        throw err;
      }
    }

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

    // Explicitly select fields (including passwordHash for verification)
    let company: any;
    try {
      company = await this.prisma.company.findUnique({
        where: { email },
        select: {
          id: true,
          companyName: true,
          email: true,
          passwordHash: true,
          industry: true,
          website: true,
          description: true,
          contactPersonName: true,
          phone: true,
          companySize: true,
          createdAt: true,
        },
      });
    } catch (err: any) {
      // If the selected columns don't exist in the DB (P2022), retry with a safe subset
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2022'
      ) {
        console.warn(
          '[companies.service] Prisma P2022 during login - missing column(s), retrying with fallback select',
          err.meta,
        );
        // Exclude optional new columns that may not exist yet: contactPersonName, phone, companySize
        company = await this.prisma.company.findUnique({
          where: { email },
          select: {
            id: true,
            companyName: true,
            email: true,
            passwordHash: true,
            industry: true,
            website: true,
            description: true,
            createdAt: true,
          },
        });
      } else {
        throw err;
      }
    }

    if (!company) {
      console.log('Company not found with email:', email);
      throw new UnauthorizedException('Invalid email');
    }

    const ok = await bcrypt.compare(password, company.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid password');

    const { passwordHash, ...safeCompany } = company;

    // Sign a minimal token payload (avoid embedding passwordHash or large objects)
    const tokenPayload = {
      id: safeCompany.id,
      companyName: safeCompany.companyName,
      email: safeCompany.email,
    } as const;

    const access_token = await this.jwtService.signAsync(tokenPayload);

    return {
      access_token,
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
    let company: any;

    try {
      company = await this.prisma.company.findUnique({
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
    } catch (err: any) {
      // If the selected columns don't exist in the DB (P2022), retry with a safe subset
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2022'
      ) {
        console.warn(
          '[companies.service] Prisma P2022 during findOne - missing column(s), retrying with fallback select',
          err.meta,
        );
        // Exclude optional new columns that may not exist yet: contactPersonName, phone, companySize
        company = await this.prisma.company.findUnique({
          where: { id },
          select: {
            id: true,
            companyName: true,
            email: true,
            industry: true,
            website: true,
            description: true,
            createdAt: true,
            jobs: {
              orderBy: { createdAt: 'desc' },
            },
          } as any,
        });
      } else {
        throw err;
      }
    }

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
