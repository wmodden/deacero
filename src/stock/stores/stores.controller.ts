import { Controller, Get, Param } from '@nestjs/common';
import { StockService } from '../stock.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly stockService: StockService) {}

  @Get(':id/inventory')
  async getStoreInventory(@Param('id') id: string) {
    return await this.stockService.listInventoryStore(id);
  }

  @Get()
  async getStores() {
    return await this.stockService.listStores();
  }
}
