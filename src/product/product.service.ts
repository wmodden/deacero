import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductMetaDto } from './dto/product-meta.dto';
import { ErrorHandler } from 'src/error/error.handler';
import { ProductFilterBuilder } from './product.filter-builder';

@Injectable()
export class ProductService {
  constructor(private readonly dbService: DbService) {}

  async getProducts(productMetaDto: ProductMetaDto) {
    const { page, pageSize } = productMetaDto;

    const skip = (page - 1) * pageSize; // Calculate the number of items to skip

    // build filter bag dynamically
    const filterBag = ProductFilterBuilder.buildFilters(
      productMetaDto.category,
      productMetaDto.minPrice,
      productMetaDto.maxPrice,
      productMetaDto.stock,
    );

    try {
      const [total, data] = await Promise.all([
        this.dbService.product.count({ where: filterBag }),
        this.dbService.product.findMany({
          skip,
          take: pageSize,
          where: filterBag,
          include: {
            inventories: {
              select: { quantity: true, storeId: true },
              orderBy: { storeId: 'asc' },
            },
          },
        }),
      ]);

      return {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize), // Calculate total pages
        data,
      };
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  async createProduct(createProductDto: CreateProductDto) {
    try {
      return await this.dbService.product.create({
        data: {
          ...createProductDto,
        },
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  async updateProduct(sku: string, updateProductDto: UpdateProductDto) {
    await this.findProduct(sku);

    try {
      return await this.dbService.product.update({
        where: { sku },
        data: { ...updateProductDto },
      });
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  async getProduct(sku: string) {
    return await this.findProduct(sku);
  }

  async deleteProduct(sku: string) {
    const product = await this.findProduct(sku);
    return await this.dbService.product.delete({ where: { sku: product.sku } });
  }

  async findProduct(sku: string) {
    const product = await this.dbService.product.findUnique({
      where: { sku },
    });

    if (!product) {
      throw new NotFoundException('Producto no existe');
    }
    return product;
  }
}
