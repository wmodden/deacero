import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { DbService } from 'src/db/db.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, DbService],
})
export class ProductModule {}
