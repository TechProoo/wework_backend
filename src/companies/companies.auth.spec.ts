import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { JwtService } from '@nestjs/jwt';

function randomString(prefix = '') {
  return prefix + Math.random().toString(36).substring(2, 9);
}

describe('CompaniesService (auth flow)', () => {
  let service: CompaniesService;

  beforeEach(async () => {
    const mockJwtService = { signAsync: jest.fn().mockResolvedValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('signUp should create a company and company admin user with random data', async () => {
    const email = `${randomString('e_')}@example.com`;
    const password = randomString('p_') + 'A1!';
    const companyName = randomString('Co');

    // Prepare fake created objects
    const fakeCompany = {
      id: randomString('cid_'),
      companyName,
      slug: companyName.toLowerCase(),
      email,
      industry: 'Software',
      website: 'https://example.com',
      companySize: '10-50',
      description: 'Test company',
      logo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const fakeUser = {
      id: randomString('uid_'),
      email,
      passwordHash: 'hashed',
      role: 'COMPANY',
      companyId: fakeCompany.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    // Replace the prisma client on the service with a stub
    (service as any).prisma = {
      company: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(fakeCompany),
      },
    };

    const dto: any = {
      email,
      password,
      companyName,
      website: fakeCompany.website,
      industry: fakeCompany.industry,
      companySize: fakeCompany.companySize,
      description: fakeCompany.description,
    };

    const result = await service.signUp(dto);

    // Expect company object
    expect(result).toHaveProperty('company');
    expect(result.company.id).toBe(fakeCompany.id);

    // Ensure prisma methods were called
    expect((service as any).prisma.company.findUnique).toHaveBeenCalledWith({
      where: { email },
    });
    expect((service as any).prisma.company.create).toHaveBeenCalled();
    // prisma.user.create should not be called because we don't have a separate User model
  });
});
