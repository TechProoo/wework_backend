import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoursesService],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should create a course and tutorial when tutorial data is provided', async () => {
    const dto: any = {
      title: 'Test Course',
      category: 'Test',
      level: 'BEGINNER',
      duration: 120,
      price: 9.99,
      thumbnail: 'img.png',
      description: 'desc',
      tutorialTitle: 'Intro Tutorial',
      tutorialContent: 'Welcome!',
      tutorialVideoUrl: 'https://video',
    };

    const fakeCreated = {
      id: 'c1',
      title: dto.title,
      category: dto.category,
      level: dto.level,
      duration: dto.duration,
      price: dto.price,
      thumbnail: dto.thumbnail,
      description: dto.description,
      tutorial: {
        id: 't1',
        courseId: 'c1',
        title: dto.tutorialTitle,
        content: dto.tutorialContent,
        videoUrl: dto.tutorialVideoUrl,
      },
    } as any;

    // stub prisma on the service
    (service as any).prisma = {
      course: {
        create: jest.fn().mockResolvedValue(fakeCreated),
      },
    };

    const result = await service.create(dto);

    expect(result).toBe(fakeCreated);
    expect((service as any).prisma.course.create).toHaveBeenCalled();
    const calledWith = (service as any).prisma.course.create.mock.calls[0][0];
    expect(calledWith.data.title).toBe(dto.title);
    expect(calledWith.data.tutorial.create.title).toBe(dto.tutorialTitle);
  });
});
