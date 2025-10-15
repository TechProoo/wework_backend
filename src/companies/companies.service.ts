import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginCompanyDto } from './dto/login-company.dto';

@Injectable()
export class CompaniesService {
  private prisma = new PrismaClient();
  constructor(private jwtService: JwtService) {}

  async signUp(createCompanyDto: CreateCompanyDto) {
    const { email, companyName, password, ...rest } = createCompanyDto;

    const existing = await this.prisma.company.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(password, 10);

    // Create the company and store passwordHash on the Company model (schema has passwordHash on Company)
    const created = await this.prisma.company.create({
      data: {
        companyName,
        email,
        passwordHash: hashed,
        industry: (rest as any).industry ?? null,
        website: (rest as any).website ?? null,
        description: (rest as any).description ?? null,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeCompany } = created;
    return { company: safeCompany };
  }

  async validateUser(email: string, password: string) {
    const company = await this.prisma.company.findUnique({ where: { email } });
    if (!company) return null;
    const ok = await bcrypt.compare(password, company.passwordHash);
    if (!ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeCompany } = company;
    return safeCompany;
  }

  async login(dto: LoginCompanyDto) {
    const { email, password } = dto;
    const company = await this.prisma.company.findUnique({ where: { email } });

    if (!company) throw new NotFoundException('Company not found');

    const ok = await bcrypt.compare(password, company.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid password');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeCompany } = company;
    return { access_token: await this.jwtService.signAsync(safeCompany) };
  }
}
