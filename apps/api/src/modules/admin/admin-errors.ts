import { ConflictException, NotFoundException } from '@nestjs/common';

export class AdminRecordNotFoundError extends Error {}
export class AdminStateConflictError extends Error {}

export async function mapAdminRepositoryErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AdminRecordNotFoundError) throw new NotFoundException('Record not found');
    if (error instanceof AdminStateConflictError) {
      throw new ConflictException('The record has changed or cannot transition to this state');
    }
    throw error;
  }
}
