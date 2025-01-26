import { Module } from '@nestjs/common';
import { InventoryController } from './inventory/inventory.controller';
import { StoresController } from './stores/stores.controller';
import { StockService } from './stock.service';
import { DbService } from 'src/db/db.service';

@Module({
  controllers: [InventoryController, StoresController],
  providers: [StockService, DbService],
})
export class StockModule {}
