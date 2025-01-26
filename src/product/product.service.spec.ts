import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from 'src/db/db.service';
import { ErrorHandler } from 'src/error/error.handler';
import { ProductFilterBuilder } from './product.filter-builder';
import { ProductService } from './product.service';

jest.mock('./../error/error.handler');
jest.mock('./product.filter-builder');

describe('ProductService', () => {
  let service: ProductService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let dbService: DbService;

  const mockDbService = {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    dbService = module.get<DbService>(DbService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products with total count', async () => {
      // Arrange
      const productMetaDto = {
        page: 1,
        pageSize: 10,
        category: 'electronics',
        minPrice: 100,
        maxPrice: 1000,
        stock: 10,
      };

      const mockFilters = { category: 'electronics' };
      (ProductFilterBuilder.buildFilters as jest.Mock).mockReturnValue(
        mockFilters,
      );

      const mockProducts = [
        { sku: 'TEST-1', name: 'Product 1' },
        { sku: 'TEST-2', name: 'Product 2' },
      ];

      mockDbService.product.count.mockResolvedValue(20);
      mockDbService.product.findMany.mockResolvedValue(mockProducts);

      // Act
      const result = await service.getProducts(productMetaDto);

      // Assert
      expect(result).toEqual({
        total: 20,
        page: 1,
        pageSize: 10,
        totalPages: 2,
        data: mockProducts,
      });

      expect(mockDbService.product.count).toHaveBeenCalledWith({
        where: mockFilters,
      });

      expect(mockDbService.product.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: mockFilters,
        include: {
          inventories: {
            select: { quantity: true, storeId: true },
            orderBy: { storeId: 'asc' },
          },
        },
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockDbService.product.count.mockRejectedValue(error);

      // Act
      await service.getProducts({ page: 1, pageSize: 10 });

      // Assert
      expect(ErrorHandler.handle).toHaveBeenCalledWith(error);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      // Arrange
      const createProductDto = {
        name: 'New Product',
        price: 100,
        sku: '10',
        category: 'SUPPLIES',
      };

      const createdProduct = {
        sku: 'NEW-1',
        ...createProductDto,
      };

      mockDbService.product.create.mockResolvedValue(createdProduct);

      // Act
      const result = await service.createProduct(createProductDto);

      // Assert
      expect(result).toEqual(createdProduct);
      expect(mockDbService.product.create).toHaveBeenCalledWith({
        data: createProductDto,
      });
    });

    it('should handle creation errors', async () => {
      // Arrange
      const error = new Error('Creation error');
      mockDbService.product.create.mockRejectedValue(error);

      // Act
      await service.createProduct({
        name: 'Test',
        price: 100,
        category: 'SUPPLIES',
        sku: 'NEW-1',
      });

      // Assert
      expect(ErrorHandler.handle).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      // Arrange
      const sku = 'TEST-1';
      const updateProductDto = {
        name: 'Updated Product',
      };

      const existingProduct = {
        sku,
        name: 'Original Product',
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateProductDto,
      };

      mockDbService.product.findUnique.mockResolvedValue(existingProduct);
      mockDbService.product.update.mockResolvedValue(updatedProduct);

      // Act
      const result = await service.updateProduct(sku, updateProductDto);

      // Assert
      expect(result).toEqual(updatedProduct);
      expect(mockDbService.product.update).toHaveBeenCalledWith({
        where: { sku },
        data: updateProductDto,
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      // Arrange
      mockDbService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateProduct('NONEXISTENT', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProduct', () => {
    it('should return a product by SKU', async () => {
      // Arrange
      const product = {
        sku: 'TEST-1',
        name: 'Test Product',
      };

      mockDbService.product.findUnique.mockResolvedValue(product);

      // Act
      const result = await service.getProduct('TEST-1');

      // Assert
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      // Arrange
      mockDbService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProduct('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete an existing product', async () => {
      // Arrange
      const product = {
        sku: 'TEST-1',
        name: 'Test Product',
      };

      mockDbService.product.findUnique.mockResolvedValue(product);
      mockDbService.product.delete.mockResolvedValue(product);

      // Act
      const result = await service.deleteProduct('TEST-1');

      // Assert
      expect(result).toEqual(product);
      expect(mockDbService.product.delete).toHaveBeenCalledWith({
        where: { sku: 'TEST-1' },
      });
    });

    it('should throw NotFoundException if product to delete does not exist', async () => {
      // Arrange
      mockDbService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteProduct('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findProduct', () => {
    it('should return a product if it exists', async () => {
      // Arrange
      const product = {
        sku: 'TEST-1',
        name: 'Test Product',
      };

      mockDbService.product.findUnique.mockResolvedValue(product);

      // Act
      const result = await service.findProduct('TEST-1');

      // Assert
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      // Arrange
      mockDbService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findProduct('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
