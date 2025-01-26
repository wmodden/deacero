import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UNEXPECTED_ERROR } from 'src/constants';

export class ErrorHandler {
  static handle(error: unknown): never {
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          throw new BadRequestException('Registro en uso');
        case 'P2025': // Record not found
          throw new BadRequestException('No encontrado');
        case 'P2003': // Foreign key constraint violation
          throw new BadRequestException('Referencia inválida');
        // Add more Prisma error codes as needed
        default:
          throw new BadRequestException();
      }
    }

    // Handle other types of errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException('Datos inválidos');
    }

    // Default error
    throw new InternalServerErrorException(UNEXPECTED_ERROR);
  }
}
