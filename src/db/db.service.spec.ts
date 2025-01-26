// import { Test, TestingModule } from '@nestjs/testing';
// import { DbService } from './db.service';

// describe('DbService', () => {
//   let service: DbService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [DbService],
//     }).compile();

//     service = module.get<DbService>(DbService);
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
// });

import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from './db.service';

describe('DbService', () => {
  let service: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbService],
    }).compile();

    service = module.get<DbService>(DbService);

    // Mock the $connect method
    jest.spyOn(service, '$connect').mockImplementation(() => Promise.resolve());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have PrismaClient methods', () => {
    expect(service.$connect).toBeDefined();
    expect(service.$disconnect).toBeDefined();
    expect(typeof service.$connect).toBe('function');
    expect(typeof service.$disconnect).toBe('function');
  });

  describe('onModuleInit', () => {
    it('should call $connect on module init', async () => {
      // Arrange
      const connectSpy = jest.spyOn(service, '$connect');

      // Act
      await service.onModuleInit();

      // Assert
      expect(connectSpy).toHaveBeenCalled();
    });

    it('should resolve successfully when $connect succeeds', async () => {
      // Act & Assert
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });

    it('should handle connection errors', async () => {
      // Arrange
      const mockError = new Error('Connection failed');
      jest.spyOn(service, '$connect').mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(mockError);
    });
  });
});
