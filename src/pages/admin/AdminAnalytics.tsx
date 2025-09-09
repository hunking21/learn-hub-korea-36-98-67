import { AdminLayout } from "@/components/admin/AdminLayout";
import { TestAnalyticsDashboard } from "@/components/admin/TestAnalyticsDashboard";

export default function AdminAnalytics() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">결과 분석</h1>
        <TestAnalyticsDashboard />
      </div>
    </AdminLayout>
  );
}