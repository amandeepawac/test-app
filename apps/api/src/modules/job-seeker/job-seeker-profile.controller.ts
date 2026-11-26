import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Put,
  Query,
  Req,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  jobSeekerProfileUpdateSchema,
  jobSeekerSkillsQuerySchema,
  type JobSeekerProfileUpdate,
  type JobSeekerSkillsQuery,
} from '@repo/contracts';
import type { JobSeekerRequest } from '@/modules/job-seeker/job-seeker-context.js';
import { JobSeekerAuthGuard } from '@/modules/job-seeker/guards/job-seeker-auth.guard.js';
import { JobSeekerProfileService } from '@/modules/job-seeker/services/job-seeker-profile.service.js';

@Controller('job-seeker')
@UsePipes(new StandardSchemaValidationPipe())
@UseGuards(JobSeekerAuthGuard)
export class JobSeekerProfileController {
  constructor(private readonly profiles: JobSeekerProfileService) {}

  @Get('profile')
  @Header('Cache-Control', 'no-store')
  get(@Req() request: JobSeekerRequest) {
    return this.profiles.findByUserId(request.user.id);
  }

  @Put('profile')
  @Header('Cache-Control', 'no-store')
  save(
    @Body({ schema: jobSeekerProfileUpdateSchema }) input: JobSeekerProfileUpdate,
    @Req() request: JobSeekerRequest,
  ) {
    return this.profiles.save(request.user.id, input);
  }

  @Post('profile/complete')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  complete(@Req() request: JobSeekerRequest) {
    return this.profiles.complete(request.user.id);
  }

  @Get('skills')
  @Header('Cache-Control', 'no-store')
  listSkills(@Query({ schema: jobSeekerSkillsQuerySchema }) query: JobSeekerSkillsQuery) {
    return this.profiles.listSkills(query);
  }
}
