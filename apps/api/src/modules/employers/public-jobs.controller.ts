import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  StandardSchemaValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  publicJobsQuerySchema,
  type PublicJobsQuery,
} from '@repo/contracts';
import { PublicJobsService } from '@/modules/employers/services/public-jobs.service.js';

@Controller('public')
@UsePipes(new StandardSchemaValidationPipe())
export class PublicJobsController {
  constructor(private readonly jobs: PublicJobsService) {}

  @Get('jobs')
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
  list(@Query({ schema: publicJobsQuerySchema }) query: PublicJobsQuery) {
    return this.jobs.list(query);
  }

  @Get('jobs/:id')
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
  findById(@Param('id', new ParseUUIDPipe({ version: 'all' })) id: string) {
    return this.jobs.findById(id);
  }

  @Get('job-categories')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=900')
  categories() {
    return this.jobs.categories();
  }
}
