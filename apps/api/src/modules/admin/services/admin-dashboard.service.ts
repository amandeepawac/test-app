import { Injectable } from '@nestjs/common';
import type { AdminDashboardResponse } from '@repo/contracts';
import { AdminDashboardRepository } from '@/modules/admin/repositories/admin-dashboard.repository.js';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly dashboard: AdminDashboardRepository) {}

  getOverview(): Promise<AdminDashboardResponse> {
    return this.dashboard.getOverview();
  }
}
