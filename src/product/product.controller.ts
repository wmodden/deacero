import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductMetaDto } from './dto/product-meta.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts(@Query() productMetaDto: ProductMetaDto) {
    return await this.productService.getProducts(productMetaDto);
  }

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productService.createProduct(createProductDto);
  }

  @Put(':sku')
  async updateProduct(
    @Param('sku') sku: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productService.updateProduct(sku, updateProductDto);
  }

  @Get(':sku')
  async getProduct(@Param('sku') sku: string) {
    return await this.productService.getProduct(sku);
  }

  @Delete(':sku') async deleteProduct(@Param('sku') sku: string) {
    return await this.productService.deleteProduct(sku);
  }
}
