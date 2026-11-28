import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Post,
  Param,
  ParseUUIDPipe,
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
  applicationPageQuerySchema,
  createApplicationSchema,
  savedJobsQuerySchema,
  type CreateApplication,
  type JobSeekerProfileUpdate,
  type JobSeekerSkillsQuery,
  type SavedJobsQuery,
} from '@repo/contracts';
import type { JobSeekerRequest } from '@/modules/job-seeker/job-seeker-context.js';
import { JobSeekerAuthGuard } from '@/modules/job-seeker/guards/job-seeker-auth.guard.js';
import { JobSeekerProfileService } from '@/modules/job-seeker/services/job-seeker-profile.service.js';
import { ApplicationService } from '@/modules/applications/application.service.js';
import { SavedJobsService } from '@/modules/job-seeker/services/saved-jobs.service.js';

@Controller('job-seeker')
@UsePipes(new StandardSchemaValidationPipe())
@UseGuards(JobSeekerAuthGuard)
export class JobSeekerProfileController {
  constructor(
    private readonly profiles: JobSeekerProfileService,
    private readonly applications: ApplicationService,
    private readonly savedJobs: SavedJobsService,
  ) {}

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

  @Post('jobs/:jobId/applications')
  @HttpCode(201)
  @Header('Cache-Control', 'no-store')
  apply(
    @Param('jobId', new ParseUUIDPipe({ version: 'all' })) jobId: string,
    @Body({ schema: createApplicationSchema }) input: CreateApplication,
    @Req() request: JobSeekerRequest,
  ) {
    return this.applications.apply(request.user.id, jobId, input);
  }

  @Get('applications')
  @Header('Cache-Control', 'no-store')
  listApplications(
    @Req() request: JobSeekerRequest,
    @Query({ schema: applicationPageQuerySchema })
    query: { page: number; pageSize: number },
  ) {
    return this.applications.listForSeeker(request.user.id, query.page, query.pageSize);
  }

  @Post('applications/:id/withdraw')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  withdrawApplication(
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Req() request: JobSeekerRequest,
  ) {
    return this.applications.withdraw(request.user.id, id);
  }

  @Get('saved-jobs')
  @Header('Cache-Control', 'no-store')
  listSavedJobs(
    @Req() request: JobSeekerRequest,
    @Query({ schema: savedJobsQuerySchema }) query: SavedJobsQuery,
  ) {
    return this.savedJobs.list(request.user.id, query);
  }

  @Get('saved-jobs/:jobId')
  @Header('Cache-Control', 'no-store')
  savedJobState(
    @Req() request: JobSeekerRequest,
    @Param('jobId', new ParseUUIDPipe({ version: 'all' })) jobId: string,
  ) {
    return this.savedJobs.findState(request.user.id, jobId);
  }

  @Put('saved-jobs/:jobId')
  @Header('Cache-Control', 'no-store')
  saveJob(
    @Req() request: JobSeekerRequest,
    @Param('jobId', new ParseUUIDPipe({ version: 'all' })) jobId: string,
  ) {
    return this.savedJobs.save(request.user.id, jobId);
  }

  @Delete('saved-jobs/:jobId')
  @Header('Cache-Control', 'no-store')
  removeSavedJob(
    @Req() request: JobSeekerRequest,
    @Param('jobId', new ParseUUIDPipe({ version: 'all' })) jobId: string,
  ) {
    return this.savedJobs.remove(request.user.id, jobId);
  }
}
