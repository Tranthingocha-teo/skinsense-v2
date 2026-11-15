import type { ActorRole } from "@/lib/actor-role";

/** The fields of a Supabase auth user this module reads. */
export interface ProfileSourceUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown> | null;
}

export interface ProfileRow {
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface SpecialistRow {
  id?: string | null;
  hospital?: string | null;
  license_number?: string | null;
  specialty?: string | null;
  experience_years?: number | null;
  bio?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: ActorRole;
  fullName: string;
  avatarUrl: string;
  phone: string;
  status: "active";
  createdAt?: string;
  customer?: { address: string; skinType: string; allergies: string };
  specialist?: {
    id?: string;
    hospital: string;
    licenseNumber: string;
    specialty: string;
    experienceYears?: number;
    bio: string;
  };
  shop?: { shopName: string; address: string; license: string; category: string; phone: string };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The signed-in user's own profile, built from their auth record, the `profiles` row and (for a
 * specialist) the `specialists` row. Every field is the user's own data or empty: the sample
 * personas in /api/profile are only for signed-out previews and must never stand in for a real
 * account (a new customer used to see "Thùy Dung", a new shop "La Roche-Posay").
 */
export function profileFromAuthUser(
  user: ProfileSourceUser,
  role: ActorRole,
  rows: { profile?: ProfileRow | null; specialist?: SpecialistRow | null; defaultAvatarUrl?: string } = {},
): UserProfile {
  const meta = user.user_metadata ?? {};
  const shopDetails = (meta.shop_details as Record<string, unknown> | undefined) ?? {};
  const email = (user.email ?? "").trim().toLowerCase();
  const phone = text(meta.phone_number) || text(user.phone);

  const profile: UserProfile = {
    id: user.id,
    email,
    role,
    fullName: text(rows.profile?.full_name) || text(meta.full_name) || text(meta.name) || email.split("@")[0],
    avatarUrl: text(rows.profile?.avatar_url) || text(meta.avatar_url) || rows.defaultAvatarUrl || "",
    phone,
    status: "active",
    createdAt: user.created_at,
  };

  if (role === "specialist") {
    const spec = rows.specialist;
    profile.specialist = {
      id: spec?.id ?? undefined,
      hospital: text(spec?.hospital) || text(meta.hospital),
      licenseNumber: text(spec?.license_number) || text(meta.license_id),
      specialty: text(spec?.specialty) || text(meta.specialty),
      experienceYears: spec?.experience_years ?? undefined,
      bio: text(spec?.bio),
    };
  } else if (role === "shop") {
    profile.shop = {
      shopName: text(meta.shop_name) || text(shopDetails.shopName) || profile.fullName,
      address: text(meta.address) || text(shopDetails.address),
      license: text(meta.license) || text(shopDetails.license),
      category: text(meta.category) || text(shopDetails.category),
      phone,
    };
  } else {
    profile.customer = {
      address: text(meta.address),
      skinType: text(meta.skin_type),
      allergies: text(meta.allergies),
    };
  }

  return profile;
}
