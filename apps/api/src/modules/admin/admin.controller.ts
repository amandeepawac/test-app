import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import type { AdminDashboardResponse } from '@repo/contracts';
import { AdminAuthGuard } from '@/modules/admin/guards/admin-auth.guard.js';
import { AdminDashboardService } from '@/modules/admin/services/admin-dashboard.service.js';

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  getOverview(): Promise<AdminDashboardResponse> {
    return this.dashboard.getOverview();
  }
}
