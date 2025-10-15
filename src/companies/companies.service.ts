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

    const created = await this.prisma.company.create({
      data: {
        email,
        companyName,
        logo: rest.logo,
        website: rest.website,
        description: rest.description,
        companySize: rest.companySize,
        industry: rest.industry,
        slug: companyName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    // Create a corresponding user record as company admin
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashed,
        firstName: rest.firstName ?? null,
        lastName: rest.lastName ?? null,
        role: 'COMPANY',
        companyId: created.id,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, companyId, ...safeUser } = user;
    return { company: created, user: safeUser };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, companyId, ...safeUser } = user;
    return safeUser;
  }

  async login(dto: LoginCompanyDto) {
    const { email, password } = dto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('User not found');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid password');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, companyId, ...safeUser } = user;
    return { access_token: await this.jwtService.signAsync(safeUser) };
  }
}
