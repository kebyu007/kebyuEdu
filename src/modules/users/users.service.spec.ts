import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@/core/database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Mock PrismaService
    const mockPrismaService = {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        phone: '+998901234567',
        role: 'STUDENT',
        birth_date: new Date('2000-01-01'),
      };
      
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.findOne(1);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('age');
      expect(prisma.user.findUnique).toHaveBeenCalled();
    });

    it('should throw an error if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow('User with ID 999 not found');
    });
  });

  describe('findAll', () => {
    it('should return an array of users with meta', async () => {
      const mockUsers = [
        { id: 1, first_name: 'John', role: 'STUDENT', birth_date: new Date() },
        { id: 2, first_name: 'Jane', role: 'TEACHER', birth_date: new Date() },
      ];
      
      jest.spyOn(prisma, '$transaction').mockResolvedValue([mockUsers, 2] as any);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});

