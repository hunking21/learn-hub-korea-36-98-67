import { AdminLayout } from "@/components/admin/AdminLayout";
import StudentTestPermissions from "@/components/admin/StudentTestPermissions";

export default function StudentPermissions() {
  return (
    <AdminLayout>
      <StudentTestPermissions />
    </AdminLayout>
  );
}