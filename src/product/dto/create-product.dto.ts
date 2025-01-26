import { PickType } from '@nestjs/mapped-types';
import { ProductDto } from './product.dto';

export class CreateProductDto extends PickType(ProductDto, [
  'category',
  'description',
  'name',
  'price',
  'sku',
] as const) {}
