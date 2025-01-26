import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { StockModule } from './stock/stock.module';
import { DbService } from './db/db.service';
import { AppController } from './app.controller';

@Module({
  imports: [ProductModule, StockModule],
  controllers: [AppController],
  providers: [DbService],
})
export class AppModule {}
