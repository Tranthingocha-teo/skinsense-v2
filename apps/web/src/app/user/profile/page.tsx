import { RoleProfileView } from "@/components/role-profile-view";

export const metadata = {
  title: "Hồ Sơ Người Dùng | SkinSense",
  description: "Quản lý hồ sơ và thông tin cá nhân khách hàng",
};

export default function UserProfilePage() {
  return <RoleProfileView role="customer" />;
}
