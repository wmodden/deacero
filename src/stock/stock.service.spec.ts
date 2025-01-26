import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { StoresController } from './stores/stores.controller';

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

  describe('getStores', () => {
    it('should return all stores', async () => {
      const expectedStores = [
        { id: '1', name: 'Store 1' },
        { id: '2', name: 'Store 2' },
      ];
      mockStockService.listStores.mockResolvedValue(expectedStores);

      const result = await controller.getStores();

      expect(result).toBe(expectedStores);
      expect(mockStockService.listStores).toHaveBeenCalled();
    });
  });

  describe('getStoreInventory', () => {
    it('should return store inventory for given id', async () => {
      const storeId = '1';
      const expectedInventory = {
        id: storeId,
        items: [
          { productId: '1', quantity: 10 },
          { productId: '2', quantity: 20 },
        ],
      };
      mockStockService.listInventoryStore.mockResolvedValue(expectedInventory);

      const result = await controller.getStoreInventory(storeId);

      expect(result).toBe(expectedInventory);
      expect(mockStockService.listInventoryStore).toHaveBeenCalledWith(storeId);
    });

    it('should handle store not found', async () => {
      const storeId = 'nonexistent';
      const error = new Error('Store not found');
      mockStockService.listInventoryStore.mockRejectedValue(error);

      await expect(controller.getStoreInventory(storeId)).rejects.toThrow(
        error,
      );
      expect(mockStockService.listInventoryStore).toHaveBeenCalledWith(storeId);
    });
  });
});
