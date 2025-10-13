import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { JwtService } from '@nestjs/jwt';

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(async () => {
    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verifyAsync: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
