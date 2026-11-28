import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  employerJobCreateSchema,
  employerJobsQuerySchema,
  employerJobUpdateSchema,
  applicationPageQuerySchema,
  updateApplicationStatusSchema,
  type EmployerJobCreate,
  type EmployerJobsQuery,
  type EmployerJobUpdate,
  type UpdateApplicationStatus,
} from '@repo/contracts';
import type { EmployerRequest } from '@/modules/employers/employer-context.js';
import { EmployerAuthGuard } from '@/modules/employers/guards/employer-auth.guard.js';
import { EmployerJobsService } from '@/modules/employers/services/employer-jobs.service.js';
import { ApplicationService } from '@/modules/applications/application.service.js';

@Controller()
@UsePipes(new StandardSchemaValidationPipe())
@UseGuards(EmployerAuthGuard)
export class EmployerJobsController {
  constructor(
    private readonly jobs: EmployerJobsService,
    private readonly applications: ApplicationService,
  ) {}

  @Post('jobs')
  @Header('Cache-Control', 'no-store')
  create(
    @Req() request: EmployerRequest,
    @Body({ schema: employerJobCreateSchema }) input: EmployerJobCreate,
  ) {
    return this.jobs.create(request.user.id, input);
  }

  @Get('employers/me/jobs')
  @Header('Cache-Control', 'no-store')
  list(
    @Req() request: EmployerRequest,
    @Query({ schema: employerJobsQuerySchema }) query: EmployerJobsQuery,
  ) {
    return this.jobs.list(request.user.id, query);
  }

  @Get('employers/me/jobs/:id')
  @Header('Cache-Control', 'no-store')
  findById(
    @Req() request: EmployerRequest,
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
  ) {
    return this.jobs.findById(request.user.id, id);
  }

  @Patch('jobs/:id')
  @Header('Cache-Control', 'no-store')
  update(
    @Req() request: EmployerRequest,
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Body({ schema: employerJobUpdateSchema }) input: EmployerJobUpdate,
  ) {
    return this.jobs.update(request.user.id, id, input);
  }

  @Post('jobs/:id/publish')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  publish(
    @Req() request: EmployerRequest,
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
  ) {
    return this.jobs.transition(request.user.id, id, 'publish');
  }

  @Post('jobs/:id/pause')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  pause(
    @Req() request: EmployerRequest,
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
  ) {
    return this.jobs.transition(request.user.id, id, 'pause');
  }

  @Get('employers/me/jobs/:id/applications')
  @Header('Cache-Control', 'no-store')
  listApplications(
    @Req() request: EmployerRequest,
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Query({ schema: applicationPageQuerySchema })
    query: { page: number; pageSize: number },
  ) {
    return this.applications.listForEmployer(request.user.id, id, query.page, query.pageSize);
  }

  @Patch('employers/me/applications/:id/status')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  updateApplicationStatus(
    @Req() request: EmployerRequest,
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Body({ schema: updateApplicationStatusSchema }) input: UpdateApplicationStatus,
  ) {
    return this.applications.updateStatus(request.user.id, id, input);
  }
}
