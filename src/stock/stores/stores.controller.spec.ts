import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StockService } from '../stock.service';

describe('StoresController', () => {
  let controller: StoresController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let stockService: StockService;

  const mockStockService = {
    listStores: jest.fn(),
    listInventoryStore: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StockService,
          useValue: mockStockService,
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
    stockService = module.get<StockService>(StockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listStores', () => {
    it('should return an array of stores', async () => {
      const result = [{ storeId: '1' }, { storeId: '2' }];
      mockStockService.listStores.mockResolvedValue(result);

      expect(await controller.getStores()).toBe(result);
      expect(mockStockService.listStores).toHaveBeenCalled();
    });
  });

  describe('getStore', () => {
    it('should return a single store', async () => {
      const result = { id: '1', name: 'Store 1' };
      mockStockService.listInventoryStore.mockResolvedValue(result);

      expect(await controller.getStoreInventory('1')).toBe(result);
      expect(mockStockService.listInventoryStore).toHaveBeenCalledWith('1');
    });
  });
});
