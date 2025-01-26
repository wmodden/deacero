import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { TransferDto } from './inventory/dto/transfer.dto';
import { ProductTransferDto } from './inventory/dto/product-transfer.dto';
import { validateTransferType } from 'src/utils';

@Injectable()
export class StockService {
  constructor(private readonly dbService: DbService) {}

  async listInventoryStore(id: string) {
    const store = await this.dbService.inventory.findUnique({ where: { id } });
    if (!store) {
      throw new BadRequestException('Almacen no existe');
    }
    return store;
  }

  private async findProductBySku(sku: string) {
    const product = await this.dbService.product.findUnique({
      where: { sku },
    });

    if (!product) {
      throw new NotFoundException('Product does not exist');
    }

    return product;
  }

  async listStores() {
    return await this.dbService.inventory.findMany({ distinct: ['storeId'] });
  }

  async transfer(
    transferDto: TransferDto,
    productTransferDto: ProductTransferDto,
  ) {
    switch (transferDto.type) {
      /**
       * OUT transfer type
       */

      case 'TRANSFER':
        // Validate the transaction type
        validateTransferType(transferDto.type, productTransferDto);

        return await this.dbService.$transaction(async () => {
          await this.findProductBySku(productTransferDto.sku);
          return true;
        });
      /**
       * IN transfer type
       */
      case 'OUT':
        // Validate the transaction type
        validateTransferType(transferDto.type, productTransferDto);

        return await this.dbService.$transaction(async (prisma) => {
          const product = await this.findProductBySku(productTransferDto.sku);

          const inventoryMetadata = await prisma.inventory.findUnique({
            select: { minStock: true, quantity: true },
            where: {
              storeId_productSku: {
                storeId: productTransferDto.sourceStoreId,
                productSku: product.sku,
              },
            },
          });

          if (!inventoryMetadata) {
            throw new NotFoundException('Unexistent inventory');
          }

          if (
            inventoryMetadata.quantity - productTransferDto.quantity <
            inventoryMetadata.minStock
          ) {
            throw new BadRequestException(
              `minimum stock is: '${inventoryMetadata.minStock}', current stock is: '${inventoryMetadata.quantity}'`,
            );
          }

          await prisma.inventory.update({
            where: {
              storeId_productSku: {
                productSku: product.sku,
                storeId: productTransferDto.sourceStoreId,
              },
            },
            data: { quantity: { decrement: productTransferDto.quantity } },
          });

          await prisma.movement.create({
            data: {
              quantity: productTransferDto.quantity,
              productSku: product.sku,
              type: transferDto.type,
              sourceStoreId: productTransferDto.sourceStoreId,
            },
          });

          return true;
        });

      /**
       * IN transfer type
       */
      case 'IN':
        validateTransferType(transferDto.type, productTransferDto);

        return await this.dbService.$transaction(async (prisma) => {
          const product = await this.findProductBySku(productTransferDto.sku);

          await prisma.inventory.upsert({
            where: {
              storeId_productSku: {
                productSku: product.sku,
                storeId: productTransferDto.targetStoreId,
              },
            },
            update: { quantity: { increment: productTransferDto.quantity } },
            create: {
              storeId: productTransferDto.targetStoreId,
              productSku: product.sku,
              quantity: productTransferDto.quantity,
            },
          });

          await prisma.movement.create({
            data: {
              quantity: productTransferDto.quantity,
              productSku: product.sku,
              type: transferDto.type,
              targetStoreId: productTransferDto.targetStoreId,
            },
          });
          return true;
        });

      default:
        break;
    }
  }
}
