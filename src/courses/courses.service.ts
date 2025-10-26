import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CoursesService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a course. If tutorial data is provided, create a Tutorial linked to the course.
   */
  async create(createCourseDto: CreateCourseDto) {
    const {
      title,
      category,
      level,
      duration,
      price,
      thumbnail,
      description,
      tutorialTitle,
      tutorialContent,
      tutorialVideoUrl,
    } = createCourseDto as any;

    if (!title || !category || !level || !duration || price === undefined) {
      throw new BadRequestException('Missing required course fields');
    }

    const data: any = {
      title,
      category,
      level,
      duration,
      price,
      thumbnail: thumbnail || '',
      description: description || '',
    };

    // If tutorial info provided, nest create
    if (tutorialTitle || tutorialContent || tutorialVideoUrl) {
      data.tutorial = {
        create: {
          title: tutorialTitle ?? `${title} - Tutorial`,
          content: tutorialContent ?? null,
          videoUrl: tutorialVideoUrl ?? null,
        },
      };
    }

    const created = await this.prisma.course.create({
      data,
      // Prisma client may need to be regenerated after schema changes; cast include to any to avoid
      // transient TypeScript type errors in this repo until `prisma generate` is run.
      include: { tutorial: true } as any,
    });

    return created;
  }

  findAll() {
    return `This action returns all courses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} course`;
  }

  update(id: number, updateCourseDto: UpdateCourseDto) {
    return `This action updates a #${id} course`;
  }

  remove(id: number) {
    return `This action removes a #${id} course`;
  }
}
