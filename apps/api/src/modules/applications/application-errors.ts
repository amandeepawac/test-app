import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export class ApplicationRecordNotFoundError extends Error {}
export class ApplicationConflictError extends Error {}
export class ApplicationProfileIncompleteError extends Error {}
export class ApplicationJobUnavailableError extends Error {}
export class ApplicationStatusTransitionError extends Error {}
export class ApplicationWithdrawNotAllowedError extends Error {}

export async function mapApplicationErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApplicationRecordNotFoundError) {
      throw new NotFoundException('Application or job not found');
    }
    if (error instanceof ApplicationProfileIncompleteError) {
      throw new BadRequestException('Complete your job seeker profile before applying');
    }
    if (error instanceof ApplicationJobUnavailableError) {
      throw new ConflictException('This job is no longer accepting applications');
    }
    if (error instanceof ApplicationStatusTransitionError) {
      throw new ConflictException('This application cannot move to the requested status');
    }
    if (error instanceof ApplicationWithdrawNotAllowedError) {
      throw new ConflictException('Only applications awaiting review can be withdrawn');
    }
    if (error instanceof ApplicationConflictError) {
      throw new ConflictException('You have already applied to this job');
    }
    throw error;
  }
}
