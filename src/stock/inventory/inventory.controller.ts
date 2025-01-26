import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StockService } from '../stock.service';
import { TransferDto } from './dto/transfer.dto';
import { ProductTransferDto } from './dto/product-transfer.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly stockService: StockService) {}

  @Post('transfer')
  async transfer(
    @Query() transferDto: TransferDto,
    @Body() productTransferDto: ProductTransferDto,
  ) {
    return await this.stockService.transfer(transferDto, productTransferDto);
  }

  @Get('alerts')
  async alerts() {
    return [];
  }
}
