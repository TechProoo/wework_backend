import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
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
  private readonly prisma: any; // Use any to bypass stale TypeScript cache

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

  // Job Profile Methods
  async createOrUpdateJobProfile(
    studentId: string,
    jobProfileData: {
      headline?: string;
      bio?: string;
      resumeUrl?: string;
      skills?: string[];
    },
  ) {
    // Check if student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.jobProfile.findUnique({
      where: { studentId },
    });

    if (existingProfile) {
      // Update existing profile
      return this.prisma.jobProfile.update({
        where: { studentId },
        data: {
          headline: jobProfileData.headline,
          bio: jobProfileData.bio,
          resumeUrl: jobProfileData.resumeUrl,
          skills: jobProfileData.skills || [],
        },
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
            },
          },
        },
      });
    } else {
      // Create new profile
      return this.prisma.jobProfile.create({
        data: {
          studentId,
          headline: jobProfileData.headline,
          bio: jobProfileData.bio,
          resumeUrl: jobProfileData.resumeUrl,
          skills: jobProfileData.skills || [],
        },
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
            },
          },
        },
      });
    }
  }

  async getJobProfile(studentId: string) {
    const profile = await this.prisma.jobProfile.findUnique({
      where: { studentId },
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
          },
        },
      },
    });

    return profile;
  }

  async deleteJobProfile(studentId: string) {
    const existingProfile = await this.prisma.jobProfile.findUnique({
      where: { studentId },
    });

    if (!existingProfile) {
      throw new NotFoundException('Job profile not found');
    }

    return this.prisma.jobProfile.delete({
      where: { studentId },
    });
  }

  /**
   * Create a new application for a student to a job.
   * Validates job existence and prevents duplicate applications.
   */
  async createApplication(
    studentId: string,
    applicationData: {
      jobId: string;
      resumeUrl?: string;
      coverLetter?: string;
    },
  ) {
    const { jobId, resumeUrl, coverLetter } = applicationData;

    // Ensure student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Ensure job exists
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Optional: disallow applying to non-open jobs
    // (business rule — adjust if you want to allow applying to closed roles)
    if (job.status && job.status !== 'OPEN') {
      throw new BadRequestException('Cannot apply to a job that is not open');
    }

    // Check for existing application by this student to this job
    const existing = await this.prisma.application.findFirst({
      where: { jobId, studentId },
    });

    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    // Create application record
    const created = await this.prisma.application.create({
      data: {
        studentId,
        jobId,
        resumeUrl: resumeUrl ?? null,
        coverLetter: coverLetter ?? null,
      },
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
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            companyId: true,
          },
        },
      },
    });

    return created;
  }

  /**
   * Get applications for a student with job info
   */
  async getApplications(studentId: string) {
    // Ensure student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const applications = await this.prisma.application.findMany({
      where: { studentId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyId: true,
            salaryRange: true,
            location: true,
            remote: true,
            company: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  }

  /**
   * Bookmarks: create, list, delete
   */
  async createBookmark(
    studentId: string,
    data: { type: 'JOB' | 'COURSE'; targetId: string },
  ) {
    // ensure student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    // prevent duplicates (unique constraint at prisma level too)
    const existing = await this.prisma.bookmark.findFirst({
      where: { studentId, type: data.type, targetId: data.targetId },
    });
    if (existing) return existing;

    const created = await this.prisma.bookmark.create({
      data: {
        studentId,
        type: data.type,
        targetId: data.targetId,
      },
    });

    return created;
  }

  async getBookmarks(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const list = await this.prisma.bookmark.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    return list;
  }

  async deleteBookmark(studentId: string, bookmarkId: string) {
    const bm = await this.prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });
    if (!bm) throw new NotFoundException('Bookmark not found');
    if (bm.studentId !== studentId)
      throw new UnauthorizedException('Not allowed to delete this bookmark');

    await this.prisma.bookmark.delete({ where: { id: bookmarkId } });
    return { success: true };
  }
}
