import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ProductTransferDto {
  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  sourceStoreId?: string;

  @IsOptional()
  @IsString()
  targetStoreId?: string;
}
