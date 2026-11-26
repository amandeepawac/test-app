import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

export class JobSeekerProfileNotFoundError extends Error {}
export class JobSeekerProfileIncompleteError extends Error {}
export class JobSeekerInvalidSkillsError extends Error {}
export class JobSeekerPhoneConflictError extends Error {}

export async function mapJobSeekerRepositoryErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof JobSeekerProfileNotFoundError) {
      throw new NotFoundException('Job seeker profile not found');
    }
    if (error instanceof JobSeekerProfileIncompleteError) {
      throw new BadRequestException('Complete the required profile fields first');
    }
    if (error instanceof JobSeekerInvalidSkillsError) {
      throw new BadRequestException('One or more skills are invalid or inactive');
    }
    if (error instanceof JobSeekerPhoneConflictError) {
      throw new ConflictException('Phone number is already in use');
    }
    throw error;
  }
}
