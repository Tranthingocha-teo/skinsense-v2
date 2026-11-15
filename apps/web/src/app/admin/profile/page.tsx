import { RoleProfileView } from "@/components/role-profile-view";

export const metadata = {
  title: "Hồ Sơ Quản Trị Viên | SkinSense",
  description: "Quản lý hồ sơ quản trị viên cấp cao Super Admin",
};

export default function AdminProfilePage() {
  return <RoleProfileView role="admin" />;
}
