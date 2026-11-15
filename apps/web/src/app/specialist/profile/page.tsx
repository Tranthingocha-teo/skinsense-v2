import { RoleProfileView } from "@/components/role-profile-view";

export const metadata = {
  title: "Hồ Sơ Bác Sĩ Da Liễu | SkinSense",
  description: "Quản lý hồ sơ bác sĩ chuyên khoa da liễu và CCHN",
};

export default function SpecialistProfilePage() {
  return <RoleProfileView role="specialist" />;
}
