import { RoleProfileView } from "@/components/role-profile-view";

export const metadata = {
  title: "Hồ Sơ Cửa Hàng | SkinSense Mall",
  description: "Quản lý thông tin gian hàng và giấy phép kinh doanh dược mỹ phẩm",
};

export default function ShopProfilePage() {
  return <RoleProfileView role="shop" />;
}
