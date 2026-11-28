import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export class JobProfileIncompleteError extends Error {}
export class EmployerJobNotFoundError extends Error {}
export class EmployerJobConflictError extends Error {}
export class EmployerJobInputError extends Error {}
export class JobVerificationRequiredError extends Error {}

export async function mapEmployerJobErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof JobProfileIncompleteError) {
      throw new BadRequestException('Complete your employer profile first');
    }
    if (error instanceof EmployerJobNotFoundError) throw new NotFoundException('Job not found');
    if (error instanceof EmployerJobConflictError) {
      throw new ConflictException('Job cannot be changed in its current state');
    }
    if (error instanceof EmployerJobInputError) throw new BadRequestException(error.message);
    if (error instanceof JobVerificationRequiredError) {
      throw new ForbiddenException('Employer verification is required to publish jobs');
    }
    throw error;
  }
}
