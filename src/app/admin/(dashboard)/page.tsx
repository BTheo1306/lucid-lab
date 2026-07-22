import { redirect } from 'next/navigation';

import { adminBasePath } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  redirect(`${await adminBasePath()}/lucid-os`);
}