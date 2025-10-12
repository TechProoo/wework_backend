import { Injectable, ConflictException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class StudentsService {
  private prisma = new PrismaClient();

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
    const { passwordHash, ...safeUser } = created;
    return safeUser;
  }
}
