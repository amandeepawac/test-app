import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

export class EmployerProfileNotFoundError extends Error {}
export class EmployerProfileIncompleteError extends Error {}
export class EmployerIdentityChangeConflictError extends Error {}

export async function mapEmployerRepositoryErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof EmployerProfileNotFoundError) {
      throw new NotFoundException('Employer profile not found');
    }
    if (error instanceof EmployerProfileIncompleteError) {
      throw new BadRequestException('Complete the required profile fields first');
    }
    if (error instanceof EmployerIdentityChangeConflictError) {
      throw new ConflictException(
        'Business name and type cannot be changed after verification submission',
      );
    }
    throw error;
  }
}
