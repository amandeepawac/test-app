import type { AdminDashboardResponse } from '@repo/contracts';

export abstract class AdminDashboardRepository {
  abstract getOverview(): Promise<AdminDashboardResponse>;
}
