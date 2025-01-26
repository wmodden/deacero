import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductMetaDto } from './dto/product-meta.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: ProductService;

  const mockProductService = {
    getProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    getProduct: jest.fn(),
    deleteProduct: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return an array of products with pagination', async () => {
      const productMetaDto: ProductMetaDto = {
        page: 1,
        pageSize: 10,
      };

      const expectedResult = {
        data: [
          { sku: 'TEST-1', name: 'Product 1' },
          { sku: 'TEST-2', name: 'Product 2' },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      mockProductService.getProducts.mockResolvedValue(expectedResult);

      const result = await controller.getProducts(productMetaDto);

      expect(result).toBe(expectedResult);
      expect(productService.getProducts).toHaveBeenCalledWith(productMetaDto);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'New Product',
        price: 99.99,
        sku: 'SKU-2',
        category: 'SUPPLIES',
      };

      const expectedResult = {
        sku: 'TEST-1',
        ...createProductDto,
      };

      mockProductService.createProduct.mockResolvedValue(expectedResult);

      const result = await controller.createProduct(createProductDto);

      expect(result).toBe(expectedResult);
      expect(productService.createProduct).toHaveBeenCalledWith(
        createProductDto,
      );
    });

    it('should handle creation errors', async () => {
      const createProductDto: CreateProductDto = {
        name: 'New Product',
        price: 99.99,
        sku: 'SKU-2',
        category: 'SUPPLIES',
      };

      const error = new Error('Creation failed');
      mockProductService.createProduct.mockRejectedValue(error);

      await expect(controller.createProduct(createProductDto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const sku = 'TEST-1';
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      const expectedResult = {
        sku,
        name: 'Updated Product',
        price: 99.99,
      };

      mockProductService.updateProduct.mockResolvedValue(expectedResult);

      const result = await controller.updateProduct(sku, updateProductDto);

      expect(result).toBe(expectedResult);
      expect(productService.updateProduct).toHaveBeenCalledWith(
        sku,
        updateProductDto,
      );
    });

    it('should handle update errors', async () => {
      const sku = 'TEST-1';
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      const error = new Error('Update failed');
      mockProductService.updateProduct.mockRejectedValue(error);

      await expect(
        controller.updateProduct(sku, updateProductDto),
      ).rejects.toThrow(error);
    });
  });

  describe('getProduct', () => {
    it('should return a single product', async () => {
      const sku = 'TEST-1';
      const expectedResult = {
        sku,
        name: 'Test Product',
        price: 99.99,
      };

      mockProductService.getProduct.mockResolvedValue(expectedResult);

      const result = await controller.getProduct(sku);

      expect(result).toBe(expectedResult);
      expect(productService.getProduct).toHaveBeenCalledWith(sku);
    });

    it('should handle product not found', async () => {
      const sku = 'NONEXISTENT';
      const error = new Error('Product not found');
      mockProductService.getProduct.mockRejectedValue(error);

      await expect(controller.getProduct(sku)).rejects.toThrow(error);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const sku = 'TEST-1';
      const expectedResult = {
        success: true,
      };

      mockProductService.deleteProduct.mockResolvedValue(expectedResult);

      const result = await controller.deleteProduct(sku);

      expect(result).toBe(expectedResult);
      expect(productService.deleteProduct).toHaveBeenCalledWith(sku);
    });

    it('should handle deletion errors', async () => {
      const sku = 'TEST-1';
      const error = new Error('Deletion failed');
      mockProductService.deleteProduct.mockRejectedValue(error);

      await expect(controller.deleteProduct(sku)).rejects.toThrow(error);
    });
  });
});
