import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
      </div>
    </AdminLayout>
  );
}