import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

describe('CoursesController', () => {
  let controller: CoursesController;
  let mockService: Partial<Record<keyof CoursesService, jest.Mock>>;

  beforeEach(async () => {
    mockService = {
      create: jest
        .fn()
        .mockResolvedValue({ id: 'course-1', title: 'My Course' }),
      findAll: jest
        .fn()
        .mockResolvedValue([{ id: 'course-1', title: 'My Course' }]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'course-1', title: 'My Course' }),
      update: jest.fn().mockResolvedValue({ id: 'course-1', title: 'Updated' }),
      remove: jest.fn().mockResolvedValue({ id: 'course-1' }),
      createLesson: jest
        .fn()
        .mockResolvedValue({ id: 'lesson-1', title: 'Lesson' }),
      createTutorial: jest
        .fn()
        .mockResolvedValue({ id: 'tutorial-1', content: 'T' }),
      updateTutorial: jest
        .fn()
        .mockResolvedValue({ id: 'tutorial-1', content: 'Updated' }),
      deleteTutorial: jest.fn().mockResolvedValue({ success: true }),
      listLessons: jest.fn().mockResolvedValue([{ id: 'lesson-1' }]),
      getLesson: jest
        .fn()
        .mockResolvedValue({ id: 'lesson-1', title: 'Lesson' }),
      updateLesson: jest
        .fn()
        .mockResolvedValue({ id: 'lesson-1', title: 'Updated Lesson' }),
      deleteLesson: jest.fn().mockResolvedValue({ id: 'lesson-1' }),
      createQuizForLesson: jest.fn().mockResolvedValue({ id: 'quiz-1' }),
      setPublished: jest
        .fn()
        .mockResolvedValue({ id: 'course-1', isPublished: true }),
      importCourse: jest.fn().mockResolvedValue({ id: 'imported-course' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() should call service.create and return value', async () => {
    const dto: CreateCourseDto = {
      title: 'My Course',
      description: 'd',
      price: 0,
    } as any;
    const res = await controller.create(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual({
      statusCode: HttpStatus.CREATED,
      message: 'Course created',
      data: { id: 'course-1', title: 'My Course' },
    });
  });

  it('findAll() should call service.findAll', async () => {
    const res = await controller.findAll();
    expect(mockService.findAll).toHaveBeenCalled();
    expect(res).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Courses retrieved',
      data: [{ id: 'course-1', title: 'My Course' }],
    });
  });

  it('findOne() should call service.findOne with id', async () => {
    const res = await controller.findOne('course-1');
    expect(mockService.findOne).toHaveBeenCalledWith('course-1');
    expect(res).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Course retrieved',
      data: { id: 'course-1', title: 'My Course' },
    });
  });

  it('update() should call service.update', async () => {
    const payload = { title: 'Updated' } as any;
    const res = await controller.update('course-1', payload);
    expect(mockService.update).toHaveBeenCalledWith('course-1', payload);
    expect(res).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Course updated',
      data: { id: 'course-1', title: 'Updated' },
    });
  });

  it('remove() should call service.remove', async () => {
    const res = await controller.remove('course-1');
    expect(mockService.remove).toHaveBeenCalledWith('course-1');
    expect(res).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Course deleted',
      data: { id: 'course-1' },
    });
  });

  it('createLesson() should call service.createLesson', async () => {
    const dto: CreateLessonDto = { title: 'Lesson' } as any;
    const res = await controller.createLesson('course-1', dto);
    expect(mockService.createLesson).toHaveBeenCalledWith('course-1', dto);
    expect(res).toEqual({ id: 'lesson-1', title: 'Lesson' });
  });

  it('createTutorial/updateTutorial/deleteTutorial should call respective service methods', async () => {
    const body = { content: 'T' } as any;
    const c = await controller.createTutorial('course-1', body);
    expect(mockService.createTutorial).toHaveBeenCalledWith('course-1', body);
    expect(c).toEqual({ id: 'tutorial-1', content: 'T' });

    const u = await controller.updateTutorial('course-1', body);
    expect(mockService.updateTutorial).toHaveBeenCalledWith('course-1', body);
    expect(u).toEqual({ id: 'tutorial-1', content: 'Updated' });

    const d = await controller.deleteTutorial('course-1');
    expect(mockService.deleteTutorial).toHaveBeenCalledWith('course-1');
    expect(d).toEqual({ success: true });
  });

  it('listLessons/getLesson/updateLesson/deleteLesson should delegate to service', async () => {
    const list = await controller.listLessons('course-1');
    expect(mockService.listLessons).toHaveBeenCalledWith('course-1');
    expect(list).toEqual([{ id: 'lesson-1' }]);

    const g = await controller.getLesson('lesson-1');
    expect(mockService.getLesson).toHaveBeenCalledWith('lesson-1');
    expect(g).toEqual({ id: 'lesson-1', title: 'Lesson' });

    const updated = await controller.updateLesson('lesson-1', {
      title: 'Updated Lesson',
    });
    expect(mockService.updateLesson).toHaveBeenCalledWith('lesson-1', {
      title: 'Updated Lesson',
    });
    expect(updated).toEqual({ id: 'lesson-1', title: 'Updated Lesson' });

    const deleted = await controller.deleteLesson('lesson-1');
    expect(mockService.deleteLesson).toHaveBeenCalledWith('lesson-1');
    expect(deleted).toEqual({ id: 'lesson-1' });
  });

  it('createQuiz() should call service.createQuizForLesson', async () => {
    const body = { questions: [] } as any;
    const res = await controller.createQuiz('lesson-1', body);
    expect(mockService.createQuizForLesson).toHaveBeenCalledWith(
      'lesson-1',
      body,
    );
    expect(res).toEqual({ id: 'quiz-1' });
  });

  it('setPublished() should call service.setPublished', async () => {
    const res = await controller.setPublished('course-1', true);
    expect(mockService.setPublished).toHaveBeenCalledWith('course-1', true);
    expect(res).toEqual({ id: 'course-1', isPublished: true });
  });

  it('import() should call service.importCourse', async () => {
    const payload = { title: 'Imported' } as any;
    const res = await controller.import(payload);
    expect(mockService.importCourse).toHaveBeenCalledWith(payload);
    expect(res).toEqual({ id: 'imported-course' });
  });
});
