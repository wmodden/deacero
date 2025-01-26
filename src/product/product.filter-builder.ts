import { Prisma } from '@prisma/client';

export class ProductFilterBuilder {
  static buildFilters(
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    minStock?: number,
  ): Prisma.ProductWhereInput {
    const filters: Prisma.ProductWhereInput = {};

    // Category filter
    if (category) {
      filters.category = { in: category.split(','), mode: 'insensitive' };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.price = {};
      if (minPrice !== undefined) {
        filters.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        filters.price.lte = maxPrice;
      }
    }

    // Inventory stock filter
    if (minStock !== undefined) {
      filters.inventories = {
        some: {
          quantity: { gte: minStock },
        },
      };
    }

    return filters;
  }
}
