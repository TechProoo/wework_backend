import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { LoginStudentDto } from './dto/login-student.dto';
import { JwtService } from '@nestjs/jwt';
import { StudentData } from './interfaces/students.auth';
// import { RedisService } from 'src/redis/redis.service';

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
        progress: true,
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
  ): Promise<{ access_token: string; data: StudentData }> {
    const { email, password } = loginStudentDto;

    const user = await this.prisma.student.findUnique({
      where: { email },
      include: {
        enrollments: true,
        reviews: true,
        payments: true,
        applications: true,
        progress: true,
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
      data: safeUser,
    };
  }

  async updateProfile(
    studentId: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<StudentData> {
    // Check if student exists
    const existingStudent = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      throw new NotFoundException('Student not found');
    }

    // If email is being updated, check if it's already in use
    if (
      updateStudentDto.email &&
      updateStudentDto.email !== existingStudent.email
    ) {
      const emailInUse = await this.prisma.student.findUnique({
        where: { email: updateStudentDto.email },
      });

      if (emailInUse) {
        throw new ConflictException('Email already in use');
      }
    }

    // Prepare update data
    const updateData: any = {
      firstName: updateStudentDto.firstName,
      lastName: updateStudentDto.lastName,
      university: updateStudentDto.university,
      major: updateStudentDto.major,
      graduationYear: updateStudentDto.graduationYear,
      email: updateStudentDto.email,
    };

    // If password is being updated, hash it
    if (updateStudentDto.password) {
      updateData.passwordHash = await bcrypt.hash(
        updateStudentDto.password,
        10,
      );
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    // Update student
    const updatedStudent = await this.prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    const { passwordHash, ...safeUser } = updatedStudent;
    return safeUser;
  }

  async getTotalUsers(): Promise<number> {
    return await this.prisma.student.count();
  }

  // Return basic user list (exclude sensitive fields)
  async findAll(): Promise<any[]> {
    return await this.prisma.student.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        university: true,
        major: true,
        graduationYear: true,
        createdAt: true,
      },
    } as any);
  }

  async findOne(id: string): Promise<any | null> {
    return await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        university: true,
        major: true,
        graduationYear: true,
        createdAt: true,
      },
    } as any);
  }
}
