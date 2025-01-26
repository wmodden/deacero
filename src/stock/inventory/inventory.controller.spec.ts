import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { StockService } from '../stock.service';
import { TransferDto } from './dto/transfer.dto';
import { ProductTransferDto } from './dto/product-transfer.dto';

describe('InventoryController', () => {
  let controller: InventoryController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let stockService: StockService;

  const mockStockService = {
    transfer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: StockService,
          useValue: mockStockService,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    stockService = module.get<StockService>(StockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('transfer', () => {
    it('should successfully transfer inventory', async () => {
      // Arrange
      const transferDto: TransferDto = {
        type: 'OUT',
      };

      const productTransferDto: ProductTransferDto = {
        sku: 'TEST123',
        quantity: 5,
        sourceStoreId: 'store1',
        targetStoreId: 'store2',
      };

      mockStockService.transfer.mockResolvedValue(true);

      // Act
      const result = await controller.transfer(transferDto, productTransferDto);

      // Assert
      expect(result).toBe(true);
      expect(mockStockService.transfer).toHaveBeenCalledWith(
        transferDto,
        productTransferDto,
      );
    });

    it('should handle transfer failure', async () => {
      // Arrange
      const transferDto: TransferDto = {
        type: 'OUT',
      };

      const productTransferDto: ProductTransferDto = {
        sku: 'TEST123',
        quantity: 5,
        sourceStoreId: 'store1',
        targetStoreId: 'store2',
      };

      const error = new Error('Transfer failed');
      mockStockService.transfer.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.transfer(transferDto, productTransferDto),
      ).rejects.toThrow(error);
      expect(mockStockService.transfer).toHaveBeenCalledWith(
        transferDto,
        productTransferDto,
      );
    });
  });

  describe('alerts', () => {
    it('should return empty array', async () => {
      // Act
      const result = await controller.alerts();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
