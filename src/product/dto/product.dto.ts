import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  sku: string;
}
