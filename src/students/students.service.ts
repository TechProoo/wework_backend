import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { LoginStudentDto } from './dto/login-student.dto';
import { JwtService } from '@nestjs/jwt';
import { StudentData } from './interfaces/students.auth';

@Injectable()
export class StudentsService {
  private readonly prisma: PrismaClient;

  constructor(private readonly jwtService: JwtService) {
    this.prisma = new PrismaClient();
  }

  async signUp(createStudentDto: CreateStudentDto): Promise<StudentData> {
    const {
      password,
      email,
      firstName,
      lastName,
      university,
      major,
      graduationYear,
    } = createStudentDto;

    const existingUser = await this.prisma.student.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await this.prisma.student.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        university,
        major,
        graduationYear,
      },
    });

    const { passwordHash, ...safeUser } = created;
    return safeUser;
  }

  /** Validate credentials for passport local strategy */
  async validateUser(email: string, password: string) {
    const user = (await this.prisma.student.findUnique({
      where: { email },
      include: {
        enrollments: true,
        reviews: true,
        payments: true,
        applications: true,
      },
    })) as StudentData | null;

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(
    loginStudentDto: LoginStudentDto,
  ): Promise<{ access_token: string }> {
    const { email, password } = loginStudentDto;

    const user = await this.prisma.student.findUnique({
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

    const isPasswordValid = await bcrypt.compare(password, user!.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const { passwordHash, ...safeUser } = user;
    return {
      access_token: await this.jwtService.signAsync(safeUser),
    };
  }
}
