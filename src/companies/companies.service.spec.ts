import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { JwtService } from '@nestjs/jwt';

describe('CompaniesService', () => {
  let service: CompaniesService;

  beforeEach(async () => {
    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verifyAsync: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
