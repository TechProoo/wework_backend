import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginCompanyDto } from './dto/login-company.dto';

@Injectable()
export class CompaniesService {
  private prisma = new PrismaClient();
  constructor(private jwtService: JwtService) {}

  async signUp(createCompanyDto: CreateCompanyDto) {
    let { email, companyName, password, ...rest } = createCompanyDto;
    email = String(email).trim().toLowerCase();

    // Check if email already exists
    const existingUser = await this.prisma.company.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create the company and store passwordHash
    const created = await this.prisma.company.create({
      data: {
        companyName,
        email,
        passwordHash: hashed,
        industry: rest.industry ?? null,
        website: rest.website ?? null,
        description: rest.description ?? null,
      },
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
}
