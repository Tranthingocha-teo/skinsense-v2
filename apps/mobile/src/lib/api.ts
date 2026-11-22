import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatVnd, generateTrackingTimeline, type Order, type OrderStatus } from '@skinsense/domain';
import type { SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_API_BASE_URL = 'https://skinsense-v2-topaz.vercel.app';
const LOCAL_CLINICAL_RECORDS_KEY = 'skinsense_mobile_local_clinical_records';
const LOCAL_CUSTOM_ROUTINE_IDS_KEY = 'skinsense_mobile_custom_routine_ids';

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  return (configured && configured.length > 0 ? configured : DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

function getSupabase(): SupabaseClient | null {
  try {
    return require('./supabase').supabase;
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function apiJson<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init.headers as Record<string, string>) ?? {}),
    };
    const url = path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`;
    const res = await fetch(url, { ...init, credentials: 'omit', headers });
    const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || `HTTP ${res.status}`,
      };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export interface AuthMeRemoteUser {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'specialist' | 'shop' | 'admin';
  status: string;
  isSuperAdmin?: boolean;
  licenseId?: string;
  hospital?: string;
  specialty?: string;
  shopDetails?: {
    shopName?: string;
    ownerName?: string;
    license?: string;
    category?: string;
    address?: string;
    phone?: string;
  };
}

export async function fetchAuthMeRemote(accessToken?: string) {
  return apiJson<{ authenticated: boolean; role?: string; user?: AuthMeRemoteUser }>('/api/auth/me', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

export interface MarketplaceApiProduct {
  id: string;
  name: string;
  shopName: string;
  brand?: string;
  category?: string;
  price: number;
  stock?: number;
  sku?: string;
  status: 'approved' | 'pending' | 'rejected' | 'hidden' | string;
  submittedAt?: string;
  coverImage?: string;
  images?: string[];
  description?: string;
  origin?: string;
}

export async function fetchApprovedMarketplaceProducts(): Promise<MarketplaceApiProduct[]> {
  const res = await apiJson<{ ok?: boolean; products?: MarketplaceApiProduct[] }>('/api/admin/products');
  if (!res.ok || !res.data?.ok || !Array.isArray(res.data.products)) return [];
  return res.data.products.filter((p) => p.status === 'approved');
}

export async function loadAdminProductsRemote(shopName?: string) {
  const qs = shopName ? `?shopName=${encodeURIComponent(shopName)}` : '';
  return apiJson<{ ok: boolean; products?: MarketplaceApiProduct[] }>(`/api/admin/products${qs}`);
}

export async function createProductRemote(payload: {
  name: string;
  shopName?: string;
  price: number;
  category?: string;
  stock?: number;
  brand?: string;
  sku?: string;
  coverImage?: string;
  images?: string[];
  description?: string;
  origin?: string;
}) {
  return apiJson<{ ok: boolean; product?: MarketplaceApiProduct }>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function moderateProductRemote(
  productId: string,
  status: 'approved' | 'rejected' | 'hidden' | 'pending',
) {
  return apiJson<{ ok: boolean; product?: MarketplaceApiProduct; message?: string }>('/api/admin/products', {
    method: 'PATCH',
    body: JSON.stringify({ productId, status }),
  });
}

export async function uploadImageRemote(file: {
  uri: string;
  mimeType?: string;
  fileName?: string;
  folder?: string;
  shopName?: string;
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'image/jpeg',
      name: file.fileName || `upload-${Date.now()}.jpg`,
    } as unknown as Blob);
    if (file.folder) formData.append('folder', file.folder);
    if (file.shopName) formData.append('shopName', file.shopName);

    const res = await fetch(`${getApiBaseUrl()}/api/upload/cloudinary`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; error?: string } | null;
    if (!res.ok || !data?.ok || !data.url) {
      return { ok: false, error: data?.error || `HTTP ${res.status}` };
    }
    return { ok: true, url: data.url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

export interface RemoteRoutineStep {
  id: string;
  stepNumber: number;
  label: string;
  productName?: string | null;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  activeIngredients?: string | null;
  stepTime?: string;
  dosage?: string | null;
  usageGuide?: string | null;
  isCompleted: boolean;
}

export interface RemoteRoutineProtocol {
  ok?: boolean;
  userId?: string;
  timeOfDay: 'morning' | 'evening';
  title: string;
  description: string;
  allocatedBy: string;
  isPrescribed: boolean;
  isDoctorPrescribed?: boolean;
  protocolProductIds?: string[];
  steps: RemoteRoutineStep[];
  completedCount: number;
  totalCount: number;
  percent: number;
}

export async function loadPersonalRoutineRemote(timeOfDay: 'morning' | 'evening') {
  return apiJson<RemoteRoutineProtocol>(`/api/routine?timeOfDay=${timeOfDay}`);
}

export interface RoutineProtocolProductPayload {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  activeIngredients?: string;
  stepTime?: 'morning' | 'evening' | 'both';
  stepNumber?: number;
  dosage?: string;
  usageGuide?: string;
}

export async function savePersonalRoutineRemote(input: {
  routineTitle?: string;
  products: RoutineProtocolProductPayload[];
}) {
  try {
    await AsyncStorage.setItem(LOCAL_CUSTOM_ROUTINE_IDS_KEY, JSON.stringify(input.products.map((p) => p.id)));
  } catch {}
  return apiJson<{ ok: boolean; savedCount: number; protocolProductIds: string[]; message?: string }>(
    '/api/routine',
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export async function loadLocalCustomRoutineProductIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CUSTOM_ROUTINE_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function toggleRemoteRoutineTick(label: string, isCompleted: boolean, night: string) {
  return apiJson<{ ok: boolean; completedLabels: string[]; completedCount: number }>('/api/routine', {
    method: 'PATCH',
    body: JSON.stringify({ label, isCompleted, night }),
  });
}

export interface ClinicalCaseProductItem {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  activeIngredients?: string;
  stepTime?: 'morning' | 'evening' | 'both' | string;
  stepNumber?: number;
  dosage?: string;
  usageGuide?: string;
}

export interface ClinicalCaseRecordItem {
  id: string;
  caseCode: string;
  patientUserId?: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  phone: string;
  submittedDate: string;
  status: 'pending_routine' | 'in_treatment' | 'completed';
  severity: 'mild' | 'moderate' | 'severe';
  skinPhotoUrl: string;
  skinType: string;
  fitzpatrickScale?: string;
  symptoms: string;
  allergies: string;
  treatmentDay?: string;
  assignedDoctor?: string;
  aiAnalysis: {
    skinHealthScore: number;
    rednessIndex: number;
    inflammatorySpots: number;
    affectedZones: string[];
  };
  currentRoutine?: {
    routineTitle: string;
    startDate: string;
    revisitDate: string;
    doctorNotes: string;
    prescribedBy?: string;
    prescribedAt?: string;
    products: ClinicalCaseProductItem[];
  };
}

export async function submitClinicalRecordRemote(payload: {
  patientName: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  phone?: string;
  skinType?: string;
  symptoms: string;
  allergies?: string;
  skinPhotoUrl?: string;
  rednessIndex?: number;
  spotsCount?: number;
  affectedZones?: string[];
  doctorId?: string;
}): Promise<{ ok: boolean; caseCode?: string; offline?: boolean; error?: string }> {
  const remote = await apiJson<{ ok: boolean; caseCode?: string; caseData?: ClinicalCaseRecordItem }>(
    '/api/patient/clinical-records',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  if (remote.ok && remote.data?.ok) {
    return { ok: true, caseCode: remote.data.caseCode };
  }

  const caseCode = `BA-LOCAL-${String(Date.now()).slice(-4)}`;
  const localRecord: ClinicalCaseRecordItem = {
    id: `local_case_${Date.now()}`,
    caseCode,
    patientName: payload.patientName,
    patientAge: payload.patientAge || 22,
    patientGender: payload.patientGender || 'Nữ',
    phone: payload.phone || '',
    submittedDate: new Date().toLocaleDateString('vi-VN'),
    severity: (payload.rednessIndex || 35) > 55 ? 'severe' : (payload.rednessIndex || 35) > 30 ? 'moderate' : 'mild',
    status: 'pending_routine',
    skinPhotoUrl: payload.skinPhotoUrl || '',
    skinType: payload.skinType || 'Hỗn hợp thiên dầu',
    fitzpatrickScale: 'Loại III (Châu Á)',
    symptoms: payload.symptoms,
    allergies: payload.allergies || 'Không ghi nhận',
    assignedDoctor: payload.doctorId || 'Bác sĩ Chuyên khoa',
    aiAnalysis: {
      skinHealthScore: Math.max(30, Math.min(95, 100 - (payload.rednessIndex || 35))),
      rednessIndex: payload.rednessIndex || 35,
      inflammatorySpots: payload.spotsCount || 4,
      affectedZones: payload.affectedZones?.length ? payload.affectedZones : ['Má trái', 'Má phải'],
    },
  };
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CLINICAL_RECORDS_KEY);
    const existing = raw ? (JSON.parse(raw) as ClinicalCaseRecordItem[]) : [];
    await AsyncStorage.setItem(LOCAL_CLINICAL_RECORDS_KEY, JSON.stringify([localRecord, ...existing]));
  } catch {}
  return { ok: true, caseCode, offline: true };
}

export async function loadMyClinicalRecordsRemote(): Promise<{
  cases: ClinicalCaseRecordItem[];
  fromRemote: boolean;
}> {
  const remote = await apiJson<{ ok: boolean; cases?: ClinicalCaseRecordItem[] }>(
    '/api/patient/clinical-records?mine=1',
  );
  if (remote.ok && remote.data?.ok && Array.isArray(remote.data.cases)) {
    return { cases: remote.data.cases, fromRemote: true };
  }
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CLINICAL_RECORDS_KEY);
    const local = raw ? (JSON.parse(raw) as ClinicalCaseRecordItem[]) : [];
    return { cases: Array.isArray(local) ? local : [], fromRemote: false };
  } catch {
    return { cases: [], fromRemote: false };
  }
}

export async function loadSpecialistCasesRemote() {
  return apiJson<{ ok: boolean; cases?: ClinicalCaseRecordItem[] }>('/api/specialist/cases');
}

export async function prescribeSpecialistCaseRemote(payload: {
  caseId: string;
  routineTitle: string;
  doctorNotes: string;
  revisitDate?: string;
  products: RoutineProtocolProductPayload[];
}) {
  return apiJson<{ ok: boolean; message?: string }>('/api/specialist/cases', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSpecialistCaseStatusRemote(
  caseId: string,
  status: 'in_treatment' | 'completed',
  clinicalSummary?: string,
) {
  return apiJson<{ ok: boolean; case?: ClinicalCaseRecordItem; message?: string }>('/api/specialist/cases', {
    method: 'PATCH',
    body: JSON.stringify({ caseId, status, clinicalSummary }),
  });
}

export async function submitRoleApplicationRemote(payload: {
  role: 'customer' | 'shop' | 'specialist';
  email: string;
  password?: string;
  fullName?: string;
  doctorName?: string;
  ownerName?: string;
  phoneNumber?: string;
  shopName?: string;
  category?: string;
  address?: string;
  license?: string;
  licenseId?: string;
  hospital?: string;
  specialty?: string;
}) {
  return apiJson<{ ok?: boolean; message?: string; error?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface AdminUserRecordRemote {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  role: 'customer' | 'specialist' | 'shop' | 'admin';
  status: 'active' | 'pending' | 'rejected' | 'suspended';
  createdAt?: string;
  submittedAt?: string;
  avatarUrl?: string;
  shopDetails?: {
    shopName: string;
    license: string;
    category: string;
    address: string;
  };
  specialistDetails?: {
    hospital: string;
    licenseId: string;
    specialty: string;
  };
}

export async function loadAdminUsersRemote() {
  return apiJson<{ ok: boolean; users?: AdminUserRecordRemote[] }>('/api/admin/users');
}

export async function createAdminUserRemote(payload: {
  email: string;
  fullName: string;
  phone?: string;
  role: 'customer' | 'shop' | 'specialist';
}) {
  return apiJson<{ ok: boolean; user?: AdminUserRecordRemote }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function patchAdminUserRemote(payload: {
  userId: string;
  role?: 'customer' | 'shop' | 'specialist';
  status?: 'active' | 'pending' | 'rejected' | 'suspended';
  unlock?: true;
  expectRole?: 'customer' | 'shop' | 'specialist';
}) {
  return apiJson<{ ok: boolean; user?: { role: string; status: string } }>('/api/admin/users', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUserRemote(userId: string) {
  return apiJson<{ ok: boolean }>(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

export interface AdminSpecialistRecordRemote {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'active' | 'pending' | 'rejected' | 'suspended';
  specialty?: string;
  licenseId?: string;
  hospital?: string;
  submittedAt?: string;
  createdAt?: string;
}

export async function loadAdminSpecialistsRemote() {
  return apiJson<{ ok: boolean; specialists?: AdminSpecialistRecordRemote[] }>('/api/admin/specialists');
}

export async function decideSpecialistApplicationRemote(userId: string, action: 'approve' | 'reject') {
  return apiJson<{ ok: boolean; message?: string; user?: { status: string } }>('/api/admin/specialists', {
    method: 'PATCH',
    body: JSON.stringify({ userId, action }),
  });
}

export interface AdminOrderRecordRemote {
  id: string;
  orderCode: string;
  customerName: string;
  shopName: string;
  totalAmount: number;
  commission: number;
  status: 'pending' | 'processing' | 'delivering' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: string;
  items?: { name?: string; quantity?: number }[];
  createdAt: string;
}

export async function loadAdminOrdersRemote() {
  return apiJson<{ ok: boolean; orders?: AdminOrderRecordRemote[] }>('/api/admin/orders');
}

export async function updateAdminOrderStatusRemote(
  orderCode: string,
  status: 'pending' | 'processing' | 'delivering' | 'delivered' | 'cancelled',
) {
  return apiJson<{ ok: boolean; order?: AdminOrderRecordRemote; message?: string }>('/api/admin/orders', {
    method: 'PATCH',
    body: JSON.stringify({ orderCode, status }),
  });
}

export interface RoleRoutineStepRemote {
  id: string;
  stepNumber: number;
  label: string;
  productName: string;
  brand: string;
  category: string;
  activeIngredients: string;
  stepTime: 'morning' | 'evening' | 'both';
  dosage: string;
  usageGuide: string;
  isCompleted?: boolean;
}

export interface RoleRoutineRemote {
  role: 'customer' | 'specialist' | 'shop' | 'admin';
  title: string;
  description: string;
  targetUser: string;
  allocatedBy: string;
  treatmentDuration: string;
  skinConcern: string;
  steps: RoleRoutineStepRemote[];
}

export async function loadAdminRoutinesRemote(role?: string) {
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiJson<{ ok: boolean; routines?: Record<string, RoleRoutineRemote>; routine?: RoleRoutineRemote }>(
    `/api/admin/routines${qs}`,
  );
}

export async function tickAdminRoutineRemote(role: string, stepId: string, isCompleted: boolean) {
  return apiJson<{
    ok: boolean;
    message?: string;
    completedCount?: number;
    totalCount?: number;
    percent?: number;
    routine?: RoleRoutineRemote;
  }>('/api/admin/routines', {
    method: 'PATCH',
    body: JSON.stringify({ role, stepId, isCompleted }),
  });
}

export async function allocateAdminRoutineRemote(payload: {
  role: string;
  targetUser: string;
  title?: string;
  description?: string;
  steps?: RoleRoutineStepRemote[];
}) {
  return apiJson<{ ok: boolean; routine?: RoleRoutineRemote }>('/api/admin/routines', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface RemoteUserOrderItem {
  id: string;
  orderCode: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: string;
  shopName: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: 'unpaid' | 'paid';
  carrier?: string;
  createdAt: string;
  items?: {
    id: string;
    name: string;
    priceVnd?: number;
    price?: number;
    quantity: number;
    image?: string;
  }[];
}

export async function loadUserOrdersRemote(role?: 'shop' | 'customer' | 'admin') {
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiJson<{ ok: boolean; orders?: RemoteUserOrderItem[] }>(`/api/user/orders${qs}`);
}

export async function mutateUserOrderRemote(payload: {
  orderCode: string;
  action: 'confirm' | 'ship' | 'deliver' | 'complete' | 'cancel' | 'pay';
}) {
  return apiJson<{ ok: boolean; order?: RemoteUserOrderItem; message?: string }>('/api/user/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function payOrderRemote(orderCode: string) {
  return apiJson<{ ok: boolean; message?: string; order?: RemoteUserOrderItem }>('/api/orders/pay', {
    method: 'POST',
    body: JSON.stringify({ orderCode }),
  });
}

export function mapRemoteOrderToDomainOrder(o: RemoteUserOrderItem): Order {
  const firstItem = o.items?.[0];
  const qty = firstItem?.quantity ?? 1;
  const rawStatus = o.status === 'delivering' ? 'shipping' : o.status;
  const status: OrderStatus =
    rawStatus === 'pending' ||
    rawStatus === 'confirmed' ||
    rawStatus === 'processing' ||
    rawStatus === 'shipping' ||
    rawStatus === 'delivered' ||
    rawStatus === 'completed' ||
    rawStatus === 'cancelled' ||
    rawStatus === 'refunded'
      ? rawStatus
      : 'pending';
  return {
    id: o.orderCode || o.id,
    shopId: o.shopName || 'skinsense-mall',
    shopName: o.shopName || 'SkinSense Official',
    productId: firstItem?.id || o.orderCode,
    productName: firstItem?.name || `Đơn hàng ${o.orderCode}`,
    productImage: firstItem?.image || '',
    priceVnd: Math.round((o.totalAmount || 0) / Math.max(1, qty)),
    quantity: qty,
    totalVnd: o.totalAmount || 0,
    totalFormatted: formatVnd(o.totalAmount || 0),
    customerName: o.customerName || 'Khách hàng',
    customerPhone: o.customerPhone || '',
    customerAddress: o.shippingAddress || '',
    paymentMethod: o.paymentMethod === 'vietqr' ? 'vietqr' : 'cod',
    status,
    shippingProvider: o.carrier || 'Giao nhanh',
    trackingCode: o.orderCode,
    trackingTimeline: generateTrackingTimeline(status, o.orderCode, o.createdAt),
    createdAt: o.createdAt,
  };
}

export interface RoleProfileRemoteData {
  id: string;
  email: string;
  role: 'customer' | 'specialist' | 'shop' | 'admin';
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  customer?: {
    address?: string;
    skinType?: string;
    allergies?: string;
  };
  specialist?: {
    hospital?: string;
    licenseNumber?: string;
    specialty?: string;
    experienceYears?: string;
    bio?: string;
  };
  shop?: {
    shopName?: string;
    address?: string;
    license?: string;
    category?: string;
  };
}

export async function loadRoleProfileRemote(role?: string) {
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiJson<{ ok: boolean; user?: RoleProfileRemoteData; error?: string }>(`/api/profile${qs}`);
}

export async function saveRoleProfileRemote(payload: RoleProfileRemoteData) {
  return apiJson<{ ok: boolean; message?: string; user?: RoleProfileRemoteData; error?: string }>(
    '/api/profile',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

export interface ChatMessageRemote {
  id: string;
  sender: 'shop' | 'user';
  senderName?: string;
  text: string;
  time: string;
  createdAt?: string;
}

export interface ChatThreadRemote {
  id: string;
  shopId: string;
  shopName: string;
  userId: string;
  userName: string;
  orderCode?: string;
  messages: ChatMessageRemote[];
  updatedAt?: string;
}

export async function loadCustomerChatRemote(shopId = 'skinsense_mall') {
  return apiJson<{ ok: boolean; thread?: ChatThreadRemote; error?: string }>(
    `/api/chat?shopId=${encodeURIComponent(shopId)}`,
  );
}

export async function loadShopChatThreadsRemote(shopId?: string) {
  const qs = shopId ? `&shopId=${encodeURIComponent(shopId)}` : '';
  return apiJson<{ ok: boolean; threads?: ChatThreadRemote[]; error?: string }>(
    `/api/chat?forShop=true${qs}`,
  );
}

export async function sendChatMessageRemote(payload: {
  shopId?: string;
  shopName?: string;
  userId?: string;
  userName?: string;
  orderCode?: string;
  sender: 'user' | 'shop';
  text: string;
}) {
  return apiJson<{ ok: boolean; thread?: ChatThreadRemote; autoReply?: boolean; error?: string }>(
    '/api/chat',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
