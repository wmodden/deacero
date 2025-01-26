import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UNEXPECTED_ERROR } from 'src/constants';
import { ErrorHandler } from './error.handler';

describe('ErrorHandler', () => {
  describe('handle', () => {
    describe('PrismaClientKnownRequestError handling', () => {
      it('should handle unique constraint violation (P2002)', () => {
        // Arrange
        const error = new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          {
            code: 'P2002',
            clientVersion: '4.x.x',
          },
        );

        // Act & Assert
        expect(() => ErrorHandler.handle(error)).toThrow(BadRequestException);
        expect(() => ErrorHandler.handle(error)).toThrow('Registro en uso');
      });

      it('should handle record not found (P2025)', () => {
        // Arrange
        const error = new Prisma.PrismaClientKnownRequestError(
          'Record not found',
          {
            code: 'P2025',
            clientVersion: '4.x.x',
          },
        );

        // Act & Assert
        expect(() => ErrorHandler.handle(error)).toThrow(BadRequestException);
        expect(() => ErrorHandler.handle(error)).toThrow('No encontrado');
      });

      it('should handle foreign key constraint violation (P2003)', () => {
        // Arrange
        const error = new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          {
            code: 'P2003',
            clientVersion: '4.x.x',
          },
        );

        // Act & Assert
        expect(() => ErrorHandler.handle(error)).toThrow(BadRequestException);
        expect(() => ErrorHandler.handle(error)).toThrow('Referencia inválida');
      });

      it('should handle unknown Prisma error codes with generic BadRequestException', () => {
        // Arrange
        const error = new Prisma.PrismaClientKnownRequestError(
          'Unknown error',
          {
            code: 'P2999', // Unknown code
            clientVersion: '4.x.x',
          },
        );

        // Act & Assert
        expect(() => ErrorHandler.handle(error)).toThrow(BadRequestException);
      });
    });

    describe('PrismaClientValidationError handling', () => {
      it('should handle validation errors', () => {
        // Arrange
        const error = new Prisma.PrismaClientValidationError(
          'Validation error',
          { clientVersion: '6.2.1' },
        );

        // Act & Assert
        expect(() => ErrorHandler.handle(error)).toThrow(BadRequestException);
        expect(() => ErrorHandler.handle(error)).toThrow('Datos inválidos');
      });
    });

    describe('Other error handling', () => {
      it('should handle unknown errors with InternalServerErrorException', () => {
        // Arrange
        const error = new Error('Random error');

        // Act & Assert
        expect(() => ErrorHandler.handle(error)).toThrow(
          InternalServerErrorException,
        );
        expect(() => ErrorHandler.handle(error)).toThrow(UNEXPECTED_ERROR);
      });

      it('should handle null error with InternalServerErrorException', () => {
        // Act & Assert
        expect(() => ErrorHandler.handle(null)).toThrow(
          InternalServerErrorException,
        );
        expect(() => ErrorHandler.handle(null)).toThrow(UNEXPECTED_ERROR);
      });

      it('should handle undefined error with InternalServerErrorException', () => {
        // Act & Assert
        expect(() => ErrorHandler.handle(undefined)).toThrow(
          InternalServerErrorException,
        );
        expect(() => ErrorHandler.handle(undefined)).toThrow(UNEXPECTED_ERROR);
      });

      it('should handle non-error objects with InternalServerErrorException', () => {
        // Arrange
        const nonError = { message: 'Not an error' };

        // Act & Assert
        expect(() => ErrorHandler.handle(nonError)).toThrow(
          InternalServerErrorException,
        );
        expect(() => ErrorHandler.handle(nonError)).toThrow(UNEXPECTED_ERROR);
      });
    });
  });
});
