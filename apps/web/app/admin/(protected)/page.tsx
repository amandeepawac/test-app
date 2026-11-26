import { AdminDashboard } from '@/features/admin/components/admin-dashboard';
import { getAdminDashboard } from '@/features/admin/admin-api';

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();
  return <AdminDashboard initialData={data} />;
}
