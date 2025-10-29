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
      duration: suppliedDuration,
      price,
      thumbnail,
      description,
      // legacy flat tutorial fields
      tutorialTitle,
      tutorialContent,
      tutorialVideoUrl,
      // new nested
      tutorial,
      lessons,
    } = createCourseDto as any;

    // Require only the essential identifying fields. Price can be 0 (free) so don't treat it as required here.
    if (!title || !category || !level) {
      throw new BadRequestException(
        'Missing required course fields: title, category, and level are required',
      );
    }

    // compute duration: if lessons provided, sum their durations; otherwise use suppliedDuration or 0
    let computedDuration = 0;
    if (Array.isArray(lessons) && lessons.length) {
      computedDuration = lessons.reduce(
        (sum: number, l: any) => sum + (Number(l.duration) || 0),
        0,
      );
    } else {
      computedDuration = Number(suppliedDuration) || 0;
    }

    const data: any = {
      title,
      category,
      level: level as any,
      duration: computedDuration,
      price,
      thumbnail: thumbnail || '',
      description: description || '',
      isPublished: false,
    };

    // tutorial: prefer nested object, fall back to legacy flat fields
    const tutorialObj =
      tutorial ??
      (tutorialTitle
        ? {
            title: tutorialTitle,
            content: tutorialContent ?? null,
            videoUrl: tutorialVideoUrl ?? null,
          }
        : null);
    if (tutorialObj) {
      data.tutorial = {
        create: {
          title: tutorialObj.title ?? `${title} - Tutorial`,
          content: tutorialObj.content ?? null,
          videoUrl: tutorialObj.videoUrl ?? null,
        },
      };
    }

    // lessons: if incoming lessons, prepare nested create including optional quiz
    if (Array.isArray(lessons) && lessons.length) {
      data.lessons = {
        create: lessons.map((l: any) => {
          const lessonData: any = {
            id: l.id,
            title: l.title,
            order: l.order ?? 0,
            duration: Number(l.duration) || 0,
            isPreview: !!l.isPreview,
            content: l.content ?? null,
            videoUrl: l.videoUrl ?? null,
            muxPlaybackId: l.muxPlaybackId ?? null,
          };

          if (l.quiz) {
            lessonData.quiz = {
              create: {
                id: l.quiz.id,
                title: l.quiz.title,
                questions: {
                  create: (l.quiz.questions || []).map((q: any) => ({
                    id: q.id,
                    text: q.text,
                    options: q.options,
                    answer: q.answer,
                  })),
                },
              },
            };
          }

          return lessonData;
        }),
      } as any;
    }

    const created = await this.prisma.course.create({
      data,
      include: { lessons: true, tutorial: true } as unknown as any,
    } as any);

    return created as any;
  }

  /* Tutorial management */
  async createTutorial(courseId: string, dto: any) {
    const { title, content, videoUrl } = dto;
    // create tutorial linked to course
    const created = await (this.prisma as any).tutorial.create({
      data: {
        courseId,
        title,
        content: content ?? null,
        videoUrl: videoUrl ?? null,
      },
    } as any);
    return created as any;
  }

  async updateTutorial(courseId: string, dto: any) {
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.videoUrl !== undefined) data.videoUrl = dto.videoUrl;

    const updated = await (this.prisma as any).tutorial.update({
      where: { courseId },
      data,
    } as any);
    return updated as any;
  }

  async deleteTutorial(courseId: string) {
    const deleted = await (this.prisma as any).tutorial.delete({
      where: { courseId },
    } as any);
    return deleted as any;
  }

  /* Lessons management */
  async listLessons(courseId: string) {
    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    } as any);
  }

  async getLesson(lessonId: string) {
    return this.prisma.lesson.findUnique({ where: { id: lessonId } } as any);
  }

  async updateLesson(lessonId: string, dto: any) {
    // if duration changes, adjust course duration
    const existing = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    } as any);
    if (!existing) throw new BadRequestException('Lesson not found');

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.order !== undefined) data.order = dto.order;
    if (dto.duration !== undefined) data.duration = Number(dto.duration) || 0;
    if (dto.isPreview !== undefined) data.isPreview = dto.isPreview;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.videoUrl !== undefined) data.videoUrl = dto.videoUrl;
    if (dto.muxPlaybackId !== undefined) data.muxPlaybackId = dto.muxPlaybackId;

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data,
    } as any);

    if (data.duration !== undefined) {
      const delta =
        Number(updated.duration || 0) - Number(existing.duration || 0);
      if (delta !== 0) {
        await this.prisma.course.update({
          where: { id: existing.courseId },
          data: { duration: { increment: delta } },
        } as any);
      }
    }

    return updated as any;
  }

  async deleteLesson(lessonId: string) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    } as any);
    if (!existing) throw new BadRequestException('Lesson not found');

    const deleted = await this.prisma.lesson.delete({
      where: { id: lessonId },
    } as any);
    // decrement course duration
    if (deleted.duration) {
      await this.prisma.course.update({
        where: { id: deleted.courseId },
        data: { duration: { decrement: deleted.duration } },
      } as any);
    }
    return deleted as any;
  }

  /* Quiz management for a lesson */
  async createQuizForLesson(lessonId: string, dto: any) {
    const { title, questions } = dto;
    const createdQuiz = await this.prisma.quiz.create({
      data: {
        title,
        questions: {
          create: (questions || []).map((q: any) => ({
            id: q.id,
            text: q.text,
            options: q.options,
            answer: q.answer,
          })),
        },
      },
    } as any);

    // attach quiz to lesson
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { quizId: createdQuiz.id },
    } as any);
    return createdQuiz as any;
  }

  /* Publish toggle */
  async setPublished(courseId: string, isPublished: boolean) {
    return this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished },
    } as any);
  }

  findAll() {
    return this.prisma.course.findMany({
      include: { lessons: true, tutorial: true } as unknown as any,
    } as any);
  }

  findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: { lessons: true, tutorial: true } as unknown as any,
    } as any);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    // perform a partial update
    const data: any = { ...updateCourseDto };
    // If duration is supplied, ensure number
    if (data.duration !== undefined)
      data.duration = Number(data.duration) as any;

    return this.prisma.course.update({ where: { id }, data } as any) as any;
  }

  remove(id: string) {
    return this.prisma.course.delete({ where: { id } } as any) as any;
  }

  /** Create a lesson for a course and update the course duration (sum) */
  async createLesson(courseId: string, dto: any) {
    const {
      title,
      order = 0,
      duration = 0,
      isPreview = false,
      content,
      videoUrl,
      muxPlaybackId,
    } = dto;

    const lesson = (await this.prisma.lesson.create({
      data: {
        courseId,
        title,
        order,
        duration: (Number(duration) || 0) as any,
        isPreview,
        content: content ?? null,
        videoUrl: videoUrl ?? null,
        muxPlaybackId: muxPlaybackId ?? null,
      },
    } as any)) as any;

    // update course total duration: increment by lesson.duration
    await this.prisma.course.update({
      where: { id: courseId },
      data: { duration: { increment: lesson.duration } } as unknown as any,
    } as any);

    return lesson;
  }

  /** Import a full course with nested tutorial, lessons and quizzes in one request */
  async importCourse(payload: any) {
    const {
      id,
      title,
      category,
      level,
      duration,
      students,
      rating,
      price,
      thumbnail,
      description,
      isPublished,
      tutorial,
      lessons,
    } = payload;

    const data: any = {
      // if id provided, allow creating with specified id
      ...(id ? { id } : {}),
      title,
      category,
      level: level as any,
      duration: Number(duration) || 0,
      students: Number(students) || 0,
      rating: Number(rating) || 0,
      price: Number(price) || 0,
      thumbnail: thumbnail ?? '',
      description: description ?? '',
      isPublished: !!isPublished,
    };

    if (tutorial) {
      data.tutorial = {
        create: {
          title: tutorial.title,
          content: tutorial.content ?? null,
          videoUrl: tutorial.videoUrl ?? null,
        },
      };
    }

    if (Array.isArray(lessons) && lessons.length) {
      data.lessons = {
        create: lessons.map((l: any) => {
          const lessonData: any = {
            id: l.id,
            title: l.title,
            order: l.order ?? 0,
            duration: Number(l.duration) || 0,
            isPreview: !!l.isPreview,
            content: l.content ?? null,
            videoUrl: l.videoUrl ?? null,
            muxPlaybackId: l.muxPlaybackId ?? null,
          };

          if (l.quiz) {
            lessonData.quiz = {
              create: {
                id: l.quiz.id,
                title: l.quiz.title,
                questions: {
                  create: l.quiz.questions.map((q: any) => ({
                    id: q.id,
                    text: q.text,
                    options: q.options,
                    answer: q.answer,
                  })),
                },
              },
            };
          }

          return lessonData;
        }),
      } as any;
    }

    const created = await this.prisma.course.create({
      data,
      include: { lessons: true, tutorial: true } as unknown as any,
    } as any);

    return created as any;
  }
}
