import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

describe('CompaniesController', () => {
  let controller: CompaniesController;

  beforeEach(async () => {
    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
      verifyAsync: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        CompaniesService,
        { provide: JwtService, useValue: mockJwtService },
        Reflector,
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
