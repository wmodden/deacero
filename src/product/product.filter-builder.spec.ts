import { Prisma } from '@prisma/client';
import { ProductFilterBuilder } from './product.filter-builder';

describe('ProductFilterBuilder', () => {
  describe('buildFilters', () => {
    it('should return empty object when no filters provided', () => {
      const result = ProductFilterBuilder.buildFilters();
      expect(result).toEqual({});
    });

    describe('Category Filters', () => {
      it('should build filter for single category', () => {
        const result = ProductFilterBuilder.buildFilters('electronics');
        expect(result).toEqual({
          category: {
            in: ['electronics'],
            mode: 'insensitive',
          },
        });
      });

      it('should build filter for multiple categories', () => {
        const result = ProductFilterBuilder.buildFilters(
          'electronics,books,games',
        );
        expect(result).toEqual({
          category: {
            in: ['electronics', 'books', 'games'],
            mode: 'insensitive',
          },
        });
      });

      it('should handle empty category string', () => {
        const result = ProductFilterBuilder.buildFilters('');
        expect(result).toEqual({});
      });
    });

    describe('Price Filters', () => {
      it('should build filter for minimum price only', () => {
        const result = ProductFilterBuilder.buildFilters(undefined, 100);
        expect(result).toEqual({
          price: {
            gte: 100,
          },
        });
      });

      it('should build filter for maximum price only', () => {
        const result = ProductFilterBuilder.buildFilters(
          undefined,
          undefined,
          500,
        );
        expect(result).toEqual({
          price: {
            lte: 500,
          },
        });
      });

      it('should build filter for price range', () => {
        const result = ProductFilterBuilder.buildFilters(undefined, 100, 500);
        expect(result).toEqual({
          price: {
            gte: 100,
            lte: 500,
          },
        });
      });

      it('should handle zero prices', () => {
        const result = ProductFilterBuilder.buildFilters(undefined, 0, 0);
        expect(result).toEqual({
          price: {
            gte: 0,
            lte: 0,
          },
        });
      });
    });

    describe('Stock Filters', () => {
      it('should build filter for minimum stock', () => {
        const result = ProductFilterBuilder.buildFilters(
          undefined,
          undefined,
          undefined,
          10,
        );
        expect(result).toEqual({
          inventories: {
            some: {
              quantity: {
                gte: 10,
              },
            },
          },
        });
      });

      it('should handle zero stock level', () => {
        const result = ProductFilterBuilder.buildFilters(
          undefined,
          undefined,
          undefined,
          0,
        );
        expect(result).toEqual({
          inventories: {
            some: {
              quantity: {
                gte: 0,
              },
            },
          },
        });
      });
    });

    describe('Combined Filters', () => {
      it('should combine all filters', () => {
        const result = ProductFilterBuilder.buildFilters(
          'electronics',
          100,
          500,
          10,
        );
        expect(result).toEqual({
          category: {
            in: ['electronics'],
            mode: 'insensitive',
          },
          price: {
            gte: 100,
            lte: 500,
          },
          inventories: {
            some: {
              quantity: {
                gte: 10,
              },
            },
          },
        });
      });

      it('should combine category and price filters', () => {
        const result = ProductFilterBuilder.buildFilters(
          'electronics',
          100,
          500,
        );
        expect(result).toEqual({
          category: {
            in: ['electronics'],
            mode: 'insensitive',
          },
          price: {
            gte: 100,
            lte: 500,
          },
        });
      });

      it('should combine price and stock filters', () => {
        const result = ProductFilterBuilder.buildFilters(
          undefined,
          100,
          500,
          10,
        );
        expect(result).toEqual({
          price: {
            gte: 100,
            lte: 500,
          },
          inventories: {
            some: {
              quantity: {
                gte: 10,
              },
            },
          },
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle undefined for all parameters', () => {
        const result = ProductFilterBuilder.buildFilters(
          undefined,
          undefined,
          undefined,
          undefined,
        );
        expect(result).toEqual({});
      });

      it('should handle null values', () => {
        const result = ProductFilterBuilder.buildFilters(
          null as unknown as string,
          null as unknown as number,
          null as unknown as number,
          null as unknown as number,
        );
        expect(result).toEqual({
          price: {
            gte: null,
            lte: null,
          },
          inventories: {
            some: {
              quantity: {
                gte: null,
              },
            },
          },
        });
      });

      it('should handle negative numbers for numeric filters', () => {
        const result = ProductFilterBuilder.buildFilters(
          undefined,
          -100,
          -50,
          -10,
        );
        expect(result).toEqual({
          price: {
            gte: -100,
            lte: -50,
          },
          inventories: {
            some: {
              quantity: {
                gte: -10,
              },
            },
          },
        });
      });

      it('should preserve type safety with Prisma.ProductWhereInput', () => {
        const result = ProductFilterBuilder.buildFilters(
          'electronics',
          100,
          500,
          10,
        );
        const isProductWhereInput = (
          obj: Prisma.ProductWhereInput,
        ): boolean => {
          return typeof obj === 'object';
        };
        expect(isProductWhereInput(result)).toBeTruthy();
      });
    });
  });
});
