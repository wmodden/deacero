import { Type } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class TransferDto {
  @IsNotEmpty()
  @IsEnum(Type)
  type: Type;
}
