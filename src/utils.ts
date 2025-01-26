// src/utils/validation.util.ts

import { BadRequestException } from '@nestjs/common';
import { Type } from '@prisma/client';
import { ProductTransferDto } from 'src/stock/inventory/dto/product-transfer.dto';

export function validateTransferType(
  type: Type,
  productTransferDto: ProductTransferDto,
) {
  switch (type) {
    case 'OUT':
      if (!productTransferDto.sourceStoreId) {
        throw new BadRequestException("Source needed for 'OUT' transactions");
      }
      break;
    case 'IN':
      if (!productTransferDto.targetStoreId) {
        throw new BadRequestException("Target needed for 'IN' transactions");
      }
      break;
    case 'TRANSFER':
      if (
        !productTransferDto.sourceStoreId ||
        !productTransferDto.targetStoreId
      ) {
        throw new BadRequestException(
          "Source and Target needed for 'TRANSFER' transactions",
        );
      }
      break;
    default:
      throw new BadRequestException('Invalid transaction type');
  }
}
