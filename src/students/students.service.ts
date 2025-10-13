import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { LoginStudentDto } from './dto/login-student.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class StudentsService {
  private prisma = new PrismaClient();
  constructor(private jwtService: JwtService) {}

  async signUp(createStudentDto: CreateStudentDto) {
    const { password, email, ...rest } = createStudentDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        ...rest,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, companyId, ...safeUser } = created;
    return safeUser;
  }

  /** Validate credentials for passport local strategy */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, companyId, ...safeUser } = user;
    return safeUser;
  }

  async login(
    loginStudentDto: LoginStudentDto,
  ): Promise<{ access_token: string }> {
    const { email, password } = loginStudentDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        enrollments: true,
        reviews: true,
        payments: true,
        applications: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, companyId, ...safeUser } = user;
    return {
      access_token: await this.jwtService.signAsync(safeUser),
    };
  }
}
