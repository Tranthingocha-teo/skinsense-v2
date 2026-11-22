import { formatVnd } from '@skinsense/domain';
import * as Haptics from 'expo-haptics';
import { useRouter, type Href } from 'expo-router';
import {
  CheckCircle2,
  Home,
  Lock,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Store,
  Trash2,
  TrendingUp,
  Unlock,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InitialsAvatar } from '@/components/artwork';
import { Icon } from '@/components/ui/icon';
import {
  BottomSheetFrame,
  HeaderIconButton,
  MODERN_CARD,
  MODERN_INPUT,
  MODERN_SUBCARD,
  PortalHeader,
  ToastBanner,
} from '@/components/ui/portal-chrome';
import { Text } from '@/components/ui/text';
import {
  allocateAdminRoutineRemote,
  createAdminUserRemote,
  decideSpecialistApplicationRemote,
  deleteAdminUserRemote,
  loadAdminOrdersRemote,
  loadAdminProductsRemote,
  loadAdminRoutinesRemote,
  loadAdminSpecialistsRemote,
  loadAdminUsersRemote,
  moderateProductRemote,
  patchAdminUserRemote,
  tickAdminRoutineRemote,
  updateAdminOrderStatusRemote,
  type AdminOrderRecordRemote,
  type AdminSpecialistRecordRemote,
  type AdminUserRecordRemote,
  type MarketplaceApiProduct,
  type RoleRoutineRemote,
} from '@/lib/api';
import { setStaffTodayViewMode, signOut, useCurrentUser } from '@/lib/auth';

type AdminNavTab =
  | 'users'
  | 'specialists'
  | 'routines'
  | 'products'
  | 'orders'
  | 'analytics'
  | 'settings';

type RoleType = 'customer' | 'shop' | 'specialist' | 'admin';

const ROLE_LABELS: Record<RoleType, string> = {
  customer: 'Khách hàng',
  shop: 'Chủ Cửa hàng',
  specialist: 'Bác sĩ Da liễu',
  admin: 'Quản trị viên',
};

const ORDER_ACTIONS: Record<
  AdminOrderRecordRemote['status'],
  { status: AdminOrderRecordRemote['status']; label: string }[]
> = {
  pending: [
    { status: 'processing', label: 'Xác nhận đơn' },
    { status: 'cancelled', label: 'Hủy đơn' },
  ],
  processing: [
    { status: 'delivering', label: 'Giao hàng' },
    { status: 'cancelled', label: 'Hủy đơn' },
  ],
  delivering: [{ status: 'delivered', label: 'Đã giao' }],
  delivered: [],
  cancelled: [],
};

const ORDER_STATUS_LABEL: Record<AdminOrderRecordRemote['status'], string> = {
  pending: 'Chờ xác nhận',
  processing: 'Shop đang đóng gói',
  delivering: 'Đang vận chuyển',
  delivered: 'Giao thành công',
  cancelled: 'Đã hủy',
};

export function AdminPortal() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const currentUser = useCurrentUser();

  const [activeTab, setActiveTab] = useState<AdminNavTab>('users');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUserRecordRemote[]>([]);
  const [specialists, setSpecialists] = useState<AdminSpecialistRecordRemote[]>([]);
  const [products, setProducts] = useState<MarketplaceApiProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrderRecordRemote[]>([]);
  const [routinesMap, setRoutinesMap] = useState<Record<string, RoleRoutineRemote>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleType | 'all' | 'pending'>('all');
  const [specFilter, setSpecFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [prodFilter, setProdFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [orderFilter, setOrderFilter] = useState<'all' | AdminOrderRecordRemote['status']>('all');
  const [activeRoutineRole, setActiveRoutineRole] = useState<RoleType>('customer');
  const [assignRoutineEmail, setAssignRoutineEmail] = useState('');

  // Add User Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'customer' | 'shop' | 'specialist'>('customer');

  // Change Role Modal
  const [editingRoleUser, setEditingRoleUser] = useState<AdminUserRecordRemote | null>(null);
  const [targetRole, setTargetRole] = useState<'customer' | 'shop' | 'specialist'>('customer');

  // Platform settings
  const [commissionRate, setCommissionRate] = useState(8);
  const [autoApproveProducts, setAutoApproveProducts] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [freeShippingThreshold] = useState(500000);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const [uRes, sRes, pRes, oRes, rRes] = await Promise.all([
      loadAdminUsersRemote(),
      loadAdminSpecialistsRemote(),
      loadAdminProductsRemote(),
      loadAdminOrdersRemote(),
      loadAdminRoutinesRemote(),
    ]);

    if (uRes.ok && uRes.data?.ok && Array.isArray(uRes.data.users)) {
      setUsers(uRes.data.users);
    } else if (uRes.status === 401 || uRes.status === 403) {
      setErrorMsg('Chỉ tài khoản Super Admin mới có quyền truy cập dữ liệu Quản trị.');
    }

    if (sRes.ok && sRes.data?.ok && Array.isArray(sRes.data.specialists)) {
      setSpecialists(sRes.data.specialists);
    } else if (uRes.ok && Array.isArray(uRes.data?.users)) {
      setSpecialists(
        uRes.data.users
          .filter((u) => u.role === 'specialist')
          .map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            phone: u.phone,
            status: u.status,
            specialty: u.specialistDetails?.specialty,
            licenseId: u.specialistDetails?.licenseId,
            hospital: u.specialistDetails?.hospital,
            submittedAt: u.submittedAt,
            createdAt: u.createdAt,
          })),
      );
    }

    if (pRes.ok && pRes.data?.ok && Array.isArray(pRes.data.products)) {
      setProducts(pRes.data.products);
    }
    if (oRes.ok && oRes.data?.ok && Array.isArray(oRes.data.orders)) {
      setOrders(oRes.data.orders);
    }
    if (rRes.ok && rRes.data?.ok && rRes.data.routines) {
      setRoutinesMap(rRes.data.routines);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'delivering');
    const totalRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalCommission = validOrders.reduce((s, o) => s + o.commission, 0);
    const pendingProducts = products.filter((p) => p.status === 'pending').length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const pendingShops = users.filter((u) => u.role === 'shop' && u.status === 'pending').length;
    const pendingDoctors = specialists.filter((s) => s.status === 'pending').length;
    return {
      totalRevenue,
      totalCommission,
      pendingProducts,
      pendingOrders,
      pendingShops,
      pendingDoctors,
      pendingAccounts: pendingShops + pendingDoctors,
    };
  }, [orders, products, specialists, users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === 'pending' && u.status !== 'pending') return false;
      if (roleFilter !== 'all' && roleFilter !== 'pending' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.shopDetails?.shopName ?? '').toLowerCase().includes(q) ||
        (u.specialistDetails?.licenseId ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, searchQuery]);

  const filteredSpecialists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return specialists.filter((s) => {
      if (specFilter !== 'all' && s.status !== specFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.licenseId ?? '').toLowerCase().includes(q) ||
        (s.hospital ?? '').toLowerCase().includes(q)
      );
    });
  }, [specialists, specFilter, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (prodFilter === 'all') return products;
    return products.filter((p) => p.status === prodFilter);
  }, [products, prodFilter]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  async function runBusy(key: string, fn: () => Promise<void>) {
    if (busyKey) return;
    setBusyKey(key);
    try {
      await fn();
    } catch (e) {
      setToastMsg(e instanceof Error ? e.message : 'Thao tác thất bại.');
    } finally {
      setBusyKey(null);
    }
  }

  async function handlePatchUser(
    u: AdminUserRecordRemote,
    patch: { role?: 'customer' | 'shop' | 'specialist'; status?: 'active' | 'pending' | 'rejected' | 'suspended'; unlock?: true; expectRole?: 'shop' },
    successText: string,
  ) {
    await runBusy(`user:${u.id}`, async () => {
      const res = await patchAdminUserRemote({ userId: u.id, ...patch });
      if (!res.ok || !res.data?.user) {
        throw new Error(res.error || 'Cập nhật tài khoản thất bại.');
      }
      setUsers((prev) =>
        prev.map((row) =>
          row.id === u.id
            ? {
                ...row,
                role: (res.data?.user?.role as RoleType) || row.role,
                status: (res.data?.user?.status as AdminUserRecordRemote['status']) || row.status,
              }
            : row,
        ),
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setToastMsg(successText);
    });
  }

  async function handleDecideDoctor(s: AdminSpecialistRecordRemote, action: 'approve' | 'reject') {
    await runBusy(`doc:${s.id}`, async () => {
      const res = await decideSpecialistApplicationRemote(s.id, action);
      if (!res.ok) throw new Error(res.error || 'Xét duyệt Bác sĩ thất bại.');
      const nextStatus = action === 'approve' ? 'active' : 'rejected';
      setSpecialists((prev) => prev.map((row) => (row.id === s.id ? { ...row, status: nextStatus } : row)));
      setUsers((prev) => prev.map((row) => (row.id === s.id ? { ...row, status: nextStatus } : row)));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setToastMsg(
        action === 'approve'
          ? `Đã phê duyệt CCHN & kích hoạt Bác sĩ ${s.name}.`
          : `Đã từ chối hồ sơ Bác sĩ ${s.name}.`,
      );
    });
  }

  async function handleDeleteUser(u: AdminUserRecordRemote) {
    Alert.alert('Xóa tài khoản', `Bạn chắc chắn muốn xóa tài khoản "${u.name}" khỏi Supabase?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () =>
          void runBusy(`del:${u.id}`, async () => {
            const res = await deleteAdminUserRemote(u.id);
            if (!res.ok) throw new Error(res.error || 'Xóa tài khoản thất bại.');
            setUsers((prev) => prev.filter((row) => row.id !== u.id));
            setToastMsg(`Đã xóa tài khoản ${u.name}.`);
          }),
      },
    ]);
  }

  async function handleCreateUser() {
    if (!newUserName.trim() || !newUserEmail.includes('@')) {
      setToastMsg('Vui lòng nhập đầy đủ họ tên và email hợp lệ.');
      return;
    }
    await runBusy('add-user', async () => {
      const res = await createAdminUserRemote({
        email: newUserEmail.trim(),
        fullName: newUserName.trim(),
        phone: newUserPhone.trim(),
        role: newUserRole,
      });
      if (!res.ok || !res.data?.user) throw new Error(res.error || 'Tạo tài khoản thất bại.');
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      setToastMsg(`Đã thêm tài khoản ${res.data.user.email} vào Supabase.`);
      await refreshAll();
    });
  }

  async function handleModerateProduct(p: MarketplaceApiProduct, status: 'approved' | 'rejected' | 'hidden') {
    await runBusy(`prod:${p.id}`, async () => {
      const res = await moderateProductRemote(p.id, status);
      if (!res.ok || !res.data?.product) throw new Error(res.error || 'Cập nhật sản phẩm thất bại.');
      setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, status } : row)));
      setToastMsg(`Sản phẩm "${p.name}": đã chuyển sang ${status}.`);
    });
  }

  async function handleOrderAction(o: AdminOrderRecordRemote, status: AdminOrderRecordRemote['status']) {
    await runBusy(`ord:${o.orderCode}`, async () => {
      const res = await updateAdminOrderStatusRemote(o.orderCode, status);
      if (!res.ok || !res.data?.order) throw new Error(res.error || 'Cập nhật đơn hàng thất bại.');
      setOrders((prev) => prev.map((row) => (row.orderCode === o.orderCode ? { ...row, status } : row)));
      setToastMsg(`Đơn ${o.orderCode}: ${ORDER_STATUS_LABEL[status]}.`);
    });
  }

  async function handleToggleRoutineStep(role: RoleType, stepId: string, isCompleted: boolean) {
    await runBusy(`rt:${stepId}`, async () => {
      const res = await tickAdminRoutineRemote(role, stepId, isCompleted);
      if (!res.ok) throw new Error(res.error || 'Không lưu được bước routine.');
      if (res.data?.routine) {
        setRoutinesMap((prev) => ({ ...prev, [role]: res.data!.routine! }));
      }
      setToastMsg(res.data?.message || 'Đã lưu trạng thái routine.');
    });
  }

  async function handleAllocateRoutine() {
    if (!assignRoutineEmail.trim()) {
      setToastMsg('Vui lòng nhập email người nhận phác đồ.');
      return;
    }
    const current = routinesMap[activeRoutineRole];
    await runBusy('alloc-routine', async () => {
      const res = await allocateAdminRoutineRemote({
        role: activeRoutineRole,
        targetUser: assignRoutineEmail.trim(),
        title: current?.title,
        description: current?.description,
        steps: current?.steps,
      });
      if (!res.ok) throw new Error(res.error || 'Phân bổ routine thất bại.');
      if (res.data?.routine) {
        setRoutinesMap((prev) => ({ ...prev, [activeRoutineRole]: res.data!.routine! }));
      }
      setToastMsg(`Đã phân bổ Routine ${activeRoutineRole.toUpperCase()} cho ${assignRoutineEmail.trim()}.`);
    });
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/sign-in' as Href);
  }

  const navTabs: { id: AdminNavTab; label: string; count?: number; icon: typeof Users }[] = [
    { id: 'users', label: 'Phân quyền 4 Role', count: metrics.pendingAccounts || undefined, icon: Users },
    { id: 'specialists', label: 'Duyệt Bác sĩ Da liễu', count: metrics.pendingDoctors || undefined, icon: Stethoscope },
    { id: 'routines', label: 'Phân Bổ Routine 4 Role', icon: Sparkles },
    { id: 'products', label: 'Duyệt Sản phẩm Shop', count: metrics.pendingProducts || undefined, icon: Package },
    { id: 'orders', label: 'Đơn hàng', count: metrics.pendingOrders || undefined, icon: ShoppingBag },
    { id: 'analytics', label: 'Doanh thu & Hoa hồng', icon: TrendingUp },
    { id: 'settings', label: 'Cấu hình Sàn', icon: Settings },
  ];

  const activeRoutine = routinesMap[activeRoutineRole];

  return (
    <View className="flex-1 bg-background">
      <PortalHeader
        topInset={top}
        tone="gold"
        icon={ShieldCheck}
        eyebrow="Cổng Quản Trị Hệ Thống Sàn"
        title={currentUser?.fullName || 'Quản Trị Cửa Hàng SkinSense'}
        eyebrowClassName="text-amber-500"
        iconWellClassName="border-amber-500/35 bg-amber-500/15"
        iconClassName="text-amber-500"
        actions={
          <>
            <Pressable
              role="button"
              accessibilityLabel="Thêm tài khoản"
              onPress={() => setShowAddUserModal(true)}
              className="h-9 flex-row items-center gap-1 rounded-[12px] bg-primary px-2.5 active:scale-[0.97]"
            >
              <Icon as={Plus} size={14} className="text-primary-foreground" />
              <Text className="text-[11.5px] font-semibold text-primary-foreground">Thêm</Text>
            </Pressable>
            <Pressable
              role="button"
              accessibilityLabel="Trang soi da"
              onPress={() => {
                setStaffTodayViewMode('skin');
                router.push('/(tabs)' as Href);
              }}
              className="h-9 flex-row items-center gap-1 rounded-[12px] border border-emerald-500/40 bg-emerald-500/15 px-2.5 active:scale-[0.97]"
            >
              <Icon as={Home} size={13} className="text-emerald-500" />
              <Text className="text-[11px] font-semibold text-emerald-500">Soi da</Text>
            </Pressable>
            <HeaderIconButton icon={User} label="Hồ sơ" onPress={() => router.push('/profile' as Href)} />
            <HeaderIconButton icon={RefreshCw} label="Làm mới" onPress={() => void refreshAll()} />
            <HeaderIconButton icon={LogOut} label="Đăng xuất" destructive onPress={() => void handleSignOut()} />
          </>
        }
        tabs={navTabs}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as AdminNavTab)}
      />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(bottom + 24, 32),
          gap: 12,
        }}
      >
        {toastMsg && <ToastBanner message={toastMsg} icon={CheckCircle2} tone="success" />}

        {errorMsg && (
          <View className="rounded-[16px] border border-destructive/40 bg-destructive/10 p-4">
            <Text className="text-[13px] font-medium text-destructive">{errorMsg}</Text>
          </View>
        )}

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator />
            <Text className="mt-2 text-[12.5px] text-muted-foreground">
              Đang tải dữ liệu thời gian thực từ Supabase...
            </Text>
          </View>
        ) : (
          <>
            {/* TAB 1: USERS & 4 ROLE GOVERNANCE */}
            {activeTab === 'users' && (
              <View className="gap-3.5">
                <View className="flex-row flex-wrap gap-2.5">
                  {(['customer', 'shop', 'specialist', 'admin'] as const).map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setRoleFilter(r)}
                      className={`flex-1 min-w-[46%] ${MODERN_CARD} p-3.5 active:scale-[0.98]`}
                    >
                      <Text className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {ROLE_LABELS[r]}
                      </Text>
                      <Text className="mt-0.5 font-display text-[24px] font-normal text-foreground">
                        {users.filter((u) => u.role === r).length}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View className="flex-row items-center gap-2.5 rounded-[14px] border border-border/90 bg-card px-3.5 h-12">
                  <Icon as={Search} size={15} className="text-muted-foreground" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Tìm tên, email, SĐT, CCHN, Shop..."
                    placeholderTextColor="#888"
                    className="flex-1 text-[13.5px] text-foreground"
                  />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
                  {[
                    { id: 'all', label: `Tất cả (${users.length})` },
                    { id: 'pending', label: `Chờ duyệt (${users.filter((u) => u.status === 'pending').length})` },
                    { id: 'customer', label: 'Khách hàng' },
                    { id: 'shop', label: 'Gian hàng' },
                    { id: 'specialist', label: 'Bác sĩ' },
                    { id: 'admin', label: 'Quản trị' },
                  ].map((f) => {
                    const active = roleFilter === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => setRoleFilter(f.id as typeof roleFilter)}
                        className={`rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                          active ? 'border-primary bg-primary' : 'border-border/80 bg-card'
                        }`}
                      >
                        <Text className={`text-[12px] font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                          {f.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {filteredUsers.map((u) => {
                  const isSuperAdmin = u.role === 'admin' || u.email.toLowerCase() === 'hattn.23itb@vku.udn.vn';
                  const isSuspended = u.status === 'suspended';
                  const isPendingShop = u.role === 'shop' && u.status === 'pending';

                  return (
                    <View
                      key={u.id}
                      className={`gap-3 rounded-[20px] border p-4 ${
                        u.status === 'pending'
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : isSuspended
                          ? 'border-destructive/40 bg-destructive/5'
                          : 'border-border/80 bg-card'
                      }`}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <InitialsAvatar name={u.name} size={40} />
                        <View className="flex-1">
                          <Text className="text-[14.5px] font-semibold text-foreground">{u.name}</Text>
                          <Text className="text-[12px] text-muted-foreground">{u.email}</Text>
                          {u.phone ? <Text className="text-[11px] text-muted-foreground">SĐT: {u.phone}</Text> : null}
                        </View>
                        <View className="items-end gap-1">
                          <View className="rounded-pill bg-surface-2 px-2 py-0.5 border border-border">
                            <Text className="text-[10px] font-semibold text-foreground">{ROLE_LABELS[u.role]}</Text>
                          </View>
                          <Text
                            className={`text-[10.5px] font-bold ${
                              u.status === 'active'
                                ? 'text-emerald-500'
                                : u.status === 'pending'
                                ? 'text-amber-500'
                                : 'text-destructive'
                            }`}
                          >
                            {u.status === 'active'
                              ? 'Hoạt động'
                              : u.status === 'pending'
                              ? 'Chờ duyệt'
                              : u.status === 'rejected'
                              ? 'Từ chối'
                              : 'Đang khóa'}
                          </Text>
                        </View>
                      </View>

                      {u.shopDetails?.shopName && (
                        <Text className="text-[11.5px] text-amber-500">
                          Shop: {u.shopDetails.shopName} {u.shopDetails.license ? `· GPKD: ${u.shopDetails.license}` : ''}
                        </Text>
                      )}
                      {u.specialistDetails?.licenseId && (
                        <Text className="text-[11.5px] text-emerald-500">
                          CCHN: {u.specialistDetails.licenseId} · {u.specialistDetails.hospital}
                        </Text>
                      )}

                      {!isSuperAdmin && (
                        <View className="flex-row flex-wrap gap-2 border-t border-border/60 pt-2.5">
                          {isPendingShop && (
                            <>
                              <Pressable
                                disabled={busyKey === `user:${u.id}`}
                                onPress={() =>
                                  void handlePatchUser(
                                    u,
                                    { status: 'active', expectRole: 'shop' },
                                    `Đã phê duyệt Cửa hàng "${u.name}"`,
                                  )
                                }
                                className="rounded-[12px] bg-emerald-600 px-3.5 py-2 active:scale-[0.98]"
                              >
                                <Text className="text-[11.5px] font-semibold text-white">Duyệt Shop</Text>
                              </Pressable>
                              <Pressable
                                disabled={busyKey === `user:${u.id}`}
                                onPress={() =>
                                  void handlePatchUser(
                                    u,
                                    { status: 'rejected', expectRole: 'shop' },
                                    `Đã từ chối Cửa hàng "${u.name}"`,
                                  )
                                }
                                className="rounded-[12px] border border-destructive/40 bg-destructive/10 px-3.5 py-2 active:scale-[0.98]"
                              >
                                <Text className="text-[11.5px] font-semibold text-destructive">Từ chối</Text>
                              </Pressable>
                            </>
                          )}
                          <Pressable
                            onPress={() => {
                              setEditingRoleUser(u);
                              setTargetRole(u.role === 'admin' ? 'customer' : u.role);
                            }}
                            className="rounded-[12px] border border-border/80 bg-surface-2 px-3 py-2 active:scale-[0.98]"
                          >
                            <Text className="text-[11.5px] font-medium text-foreground">Đổi Role</Text>
                          </Pressable>
                          <Pressable
                            disabled={busyKey === `user:${u.id}`}
                            onPress={() =>
                              void handlePatchUser(
                                u,
                                isSuspended ? { unlock: true } : { status: 'suspended' },
                                isSuspended ? `Đã mở khóa ${u.name}` : `Đã tạm khóa ${u.name}`,
                              )
                            }
                            className="flex-row items-center gap-1 rounded-[12px] border border-border/80 bg-surface-2 px-3 py-2 active:scale-[0.98]"
                          >
                            <Icon as={isSuspended ? Unlock : Lock} size={12} className="text-foreground" />
                            <Text className="text-[11.5px] text-foreground">{isSuspended ? 'Mở khóa' : 'Khóa'}</Text>
                          </Pressable>
                          <Pressable
                            disabled={busyKey === `del:${u.id}`}
                            onPress={() => void handleDeleteUser(u)}
                            className="flex-row items-center gap-1 rounded-[12px] border border-destructive/35 px-3 py-2 active:scale-[0.98]"
                          >
                            <Icon as={Trash2} size={12} className="text-destructive" />
                            <Text className="text-[11.5px] text-destructive">Xóa</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* TAB 2: DUYỆT BÁC SĨ DA LIỄU */}
            {activeTab === 'specialists' && (
              <View className="gap-3.5">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
                  {[
                    { id: 'all', label: `Tất cả (${specialists.length})` },
                    { id: 'pending', label: `Chờ duyệt (${metrics.pendingDoctors})` },
                    { id: 'active', label: 'Đã duyệt' },
                    { id: 'rejected', label: 'Từ chối' },
                  ].map((f) => {
                    const active = specFilter === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => setSpecFilter(f.id as typeof specFilter)}
                        className={`rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                          active ? 'border-emerald-600 bg-emerald-600' : 'border-border/80 bg-card'
                        }`}
                      >
                        <Text className={`text-[12px] font-medium ${active ? 'text-white' : 'text-foreground'}`}>
                          {f.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {filteredSpecialists.length === 0 ? (
                  <View className={`items-center ${MODERN_CARD} p-8`}>
                    <Text className="text-[13.5px] text-muted-foreground">Không có hồ sơ Bác sĩ nào</Text>
                  </View>
                ) : (
                  filteredSpecialists.map((s) => (
                    <View
                      key={s.id}
                      className={`gap-2.5 rounded-[20px] border p-4 ${
                        s.status === 'pending' ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/80 bg-card'
                      }`}
                    >
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <Text className="text-[15px] font-semibold text-foreground">{s.name}</Text>
                          <Text className="text-[12px] text-muted-foreground">{s.email}</Text>
                          <Text className="mt-1 text-[12px] font-medium text-primary">
                            CCHN: {s.licenseId || 'Chưa cung cấp'}
                          </Text>
                          <Text className="text-[11.5px] text-muted-foreground">
                            Đơn vị: {s.hospital || 'Chưa cập nhật'}
                          </Text>
                          {s.specialty ? (
                            <Text className="text-[11.5px] text-emerald-500">Chuyên khoa: {s.specialty}</Text>
                          ) : null}
                        </View>
                        <Text
                          className={`text-[11px] font-bold ${
                            s.status === 'pending'
                              ? 'text-amber-500'
                              : s.status === 'active'
                              ? 'text-emerald-500'
                              : 'text-destructive'
                          }`}
                        >
                          {s.status === 'pending' ? 'Chờ duyệt' : s.status === 'active' ? 'Đã duyệt' : 'Từ chối'}
                        </Text>
                      </View>

                      {s.status === 'pending' && (
                        <View className="flex-row gap-2 pt-1.5">
                          <Pressable
                            disabled={busyKey === `doc:${s.id}`}
                            onPress={() => void handleDecideDoctor(s, 'approve')}
                            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-[12px] bg-emerald-600 py-2.5 active:scale-[0.98]"
                          >
                            <Icon as={CheckCircle2} size={14} className="text-white" />
                            <Text className="text-[12.5px] font-semibold text-white">Phê duyệt CCHN</Text>
                          </Pressable>
                          <Pressable
                            disabled={busyKey === `doc:${s.id}`}
                            onPress={() => void handleDecideDoctor(s, 'reject')}
                            className="flex-row items-center justify-center gap-1 rounded-[12px] border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 active:scale-[0.98]"
                          >
                            <Icon as={XCircle} size={14} className="text-destructive" />
                            <Text className="text-[12.5px] font-semibold text-destructive">Từ chối</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 3: PHÂN BỔ ROUTINE 4 ROLE */}
            {activeTab === 'routines' && (
              <View className="gap-3.5">
                <View className="flex-row gap-2">
                  {(['customer', 'specialist', 'shop', 'admin'] as const).map((r) => {
                    const active = activeRoutineRole === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setActiveRoutineRole(r)}
                        className={`flex-1 items-center rounded-full border py-2 active:scale-[0.98] ${
                          active ? 'border-primary bg-primary' : 'border-border/80 bg-card'
                        }`}
                      >
                        <Text className={`text-[11px] font-semibold ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                          {ROLE_LABELS[r]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View className={`gap-2.5 ${MODERN_CARD} p-4`}>
                  <Text className="text-[15px] font-semibold text-foreground">
                    {activeRoutine?.title || `Routine ${ROLE_LABELS[activeRoutineRole]}`}
                  </Text>
                  <Text className="text-[12.5px] text-muted-foreground leading-4">
                    {activeRoutine?.description || 'Chưa có mô tả routine.'}
                  </Text>
                  <View className="mt-1 flex-row gap-2">
                    <TextInput
                      value={assignRoutineEmail}
                      onChangeText={setAssignRoutineEmail}
                      placeholder="Email người nhận phác đồ..."
                      placeholderTextColor="#888"
                      autoCapitalize="none"
                      className="flex-1 h-11 rounded-[13px] border border-border/90 bg-surface-2 px-3.5 text-[12.5px] text-foreground"
                    />
                    <Pressable
                      disabled={busyKey === 'alloc-routine'}
                      onPress={() => void handleAllocateRoutine()}
                      className="flex-row items-center gap-1.5 rounded-[13px] bg-emerald-600 px-3.5 py-2 active:scale-[0.98]"
                    >
                      <Icon as={Send} size={13} className="text-white" />
                      <Text className="text-[12px] font-semibold text-white">Phân bổ</Text>
                    </Pressable>
                  </View>

                  {activeRoutine?.steps?.length ? (
                    <View className="mt-2 gap-2">
                      {activeRoutine.steps.map((step) => (
                        <Pressable
                          key={step.id}
                          onPress={() => void handleToggleRoutineStep(activeRoutineRole, step.id, !step.isCompleted)}
                          className={`flex-row items-center justify-between ${MODERN_SUBCARD} p-3 active:scale-[0.99]`}
                        >
                          <View className="flex-1 pr-2">
                            <Text className="text-[13px] font-medium text-foreground">
                              {step.stepNumber}. {step.label}
                            </Text>
                            <Text className="text-[11px] text-muted-foreground">{step.productName}</Text>
                          </View>
                          <Text className={`text-[11px] font-bold ${step.isCompleted ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                            {step.isCompleted ? 'Đã xong' : 'Chưa tick'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text className="mt-2 text-[12px] text-muted-foreground">
                      Chưa có bước routine cho vai trò này.
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* TAB 4: DUYỆT SẢN PHẨM SHOP */}
            {activeTab === 'products' && (
              <View className="gap-3.5">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
                  {[
                    { id: 'pending', label: `Chờ duyệt (${metrics.pendingProducts})` },
                    { id: 'approved', label: 'Đang bán' },
                    { id: 'all', label: `Tất cả (${products.length})` },
                  ].map((f) => {
                    const active = prodFilter === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => setProdFilter(f.id as typeof prodFilter)}
                        className={`rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                          active ? 'border-foreground bg-foreground' : 'border-border/80 bg-card'
                        }`}
                      >
                        <Text className={`text-[12px] font-medium ${active ? 'text-background' : 'text-foreground'}`}>
                          {f.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {filteredProducts.map((p) => (
                  <View key={p.id} className={`gap-2.5 ${MODERN_CARD} p-4`}>
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-[14.5px] font-semibold text-foreground">{p.name}</Text>
                        <Text className="text-[12px] text-muted-foreground">
                          Shop: {p.shopName} · {formatVnd(p.price)}
                        </Text>
                      </View>
                      <Text
                        className={`text-[11px] font-bold ${
                          p.status === 'approved'
                            ? 'text-emerald-500'
                            : p.status === 'pending'
                            ? 'text-amber-500'
                            : 'text-destructive'
                        }`}
                      >
                        {p.status}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      {p.status !== 'approved' && (
                        <Pressable
                          disabled={busyKey === `prod:${p.id}`}
                          onPress={() => void handleModerateProduct(p, 'approved')}
                          className="flex-1 items-center rounded-[12px] bg-emerald-600 py-2.5 active:scale-[0.98]"
                        >
                          <Text className="text-[12px] font-semibold text-white">Phê duyệt</Text>
                        </Pressable>
                      )}
                      {p.status !== 'rejected' && (
                        <Pressable
                          disabled={busyKey === `prod:${p.id}`}
                          onPress={() => void handleModerateProduct(p, 'rejected')}
                          className="items-center rounded-[12px] border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 active:scale-[0.98]"
                        >
                          <Text className="text-[12px] font-semibold text-destructive">Từ chối</Text>
                        </Pressable>
                      )}
                      {p.status === 'approved' && (
                        <Pressable
                          disabled={busyKey === `prod:${p.id}`}
                          onPress={() => void handleModerateProduct(p, 'hidden')}
                          className="items-center rounded-[12px] border border-border/80 bg-surface-2 px-3.5 py-2.5 active:scale-[0.98]"
                        >
                          <Text className="text-[12px] text-foreground">Ẩn khỏi sàn</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 5: ĐƠN HÀNG */}
            {activeTab === 'orders' && (
              <View className="gap-3.5">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row gap-2">
                  {(['all', 'pending', 'processing', 'delivering', 'delivered', 'cancelled'] as const).map((st) => {
                    const active = orderFilter === st;
                    return (
                      <Pressable
                        key={st}
                        onPress={() => setOrderFilter(st)}
                        className={`rounded-full border px-3.5 py-2 active:scale-[0.98] ${
                          active ? 'border-primary bg-primary' : 'border-border/80 bg-card'
                        }`}
                      >
                        <Text className={`text-[12px] font-medium ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                          {st === 'all' ? `Tất cả (${orders.length})` : ORDER_STATUS_LABEL[st]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {filteredOrders.map((o) => {
                  const actions = ORDER_ACTIONS[o.status] ?? [];
                  return (
                    <View key={o.orderCode} className={`gap-2.5 ${MODERN_CARD} p-4`}>
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <Text className="text-[14.5px] font-semibold text-foreground">{o.orderCode}</Text>
                          <Text className="text-[12px] text-muted-foreground">
                            {o.customerName} · {o.shopName}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-[14.5px] font-bold text-primary">{formatVnd(o.totalAmount)}</Text>
                          <Text className="text-[10.5px] text-muted-foreground">
                            {ORDER_STATUS_LABEL[o.status]}
                          </Text>
                        </View>
                      </View>
                      {actions.length > 0 && (
                        <View className="flex-row gap-2 pt-1">
                          {actions.map((act) => (
                            <Pressable
                              key={act.status}
                              disabled={busyKey === `ord:${o.orderCode}`}
                              onPress={() => void handleOrderAction(o, act.status)}
                              className={`flex-1 items-center rounded-[12px] py-2.5 active:scale-[0.98] ${
                                act.status === 'cancelled'
                                  ? 'border border-destructive/40 bg-destructive/10'
                                  : 'bg-primary'
                              }`}
                            >
                              <Text
                                className={`text-[12px] font-semibold ${
                                  act.status === 'cancelled' ? 'text-destructive' : 'text-primary-foreground'
                                }`}
                              >
                                {act.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* TAB 6: DOANH THU & HOA HỒNG (REAL ORDERS) */}
            {activeTab === 'analytics' && (
              <View className="gap-3">
                <View className="flex-row gap-2.5">
                  <View className={`flex-1 ${MODERN_CARD} p-4`}>
                    <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Tổng doanh thu thực
                    </Text>
                    <Text className="mt-1 font-display text-[22px] font-normal text-emerald-500">
                      {formatVnd(metrics.totalRevenue)}
                    </Text>
                  </View>
                  <View className={`flex-1 ${MODERN_CARD} p-4`}>
                    <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Hoa hồng sàn ({commissionRate}%)
                    </Text>
                    <Text className="mt-1 font-display text-[22px] font-normal text-primary">
                      {formatVnd(metrics.totalCommission)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 7: CẤU HÌNH SÀN */}
            {activeTab === 'settings' && (
              <View className={`gap-3 ${MODERN_CARD} p-4`}>
                <Text className="text-[15px] font-semibold text-foreground">Cấu hình vận hành sàn</Text>
                <Text className="text-[12.5px] text-muted-foreground">
                  Hoa hồng mặc định: {commissionRate}% · Ngưỡng Freeship: {formatVnd(freeShippingThreshold)}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setAutoApproveProducts((v) => !v)}
                    className={`flex-1 items-center ${MODERN_SUBCARD} py-3 active:scale-[0.98]`}
                  >
                    <Text className="text-[12.5px] font-medium text-foreground">
                      Tự duyệt SP: {autoApproveProducts ? 'Bật' : 'Tắt'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMaintenanceMode((v) => !v)}
                    className={`flex-1 items-center ${MODERN_SUBCARD} py-3 active:scale-[0.98]`}
                  >
                    <Text className="text-[12.5px] font-medium text-foreground">
                      Bảo trì: {maintenanceMode ? 'Bật' : 'Tắt'}
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => setCommissionRate((r) => (r === 8 ? 10 : 8))}
                  className="items-center rounded-[13px] border border-border/80 py-3 active:scale-[0.98]"
                >
                  <Text className="text-[12.5px] font-medium text-foreground">Đổi mức hoa hồng ({commissionRate}%)</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setRoleFilter('shop');
                    setActiveTab('users');
                  }}
                  className={`flex-row items-center justify-center gap-1.5 ${MODERN_SUBCARD} py-3 active:scale-[0.98]`}
                >
                  <Icon as={Store} size={14} className="text-amber-500" />
                  <Text className="text-[12.5px] font-medium text-foreground">
                    Quản lý Gian hàng đối tác ({users.filter((u) => u.role === 'shop').length})
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={showAddUserModal} animationType="slide" transparent>
        <BottomSheetFrame bottomInset={bottom}>
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-[20px] font-normal text-foreground">Thêm tài khoản Supabase</Text>
              <Pressable
                onPress={() => setShowAddUserModal(false)}
                className="size-8 items-center justify-center rounded-full bg-surface-2"
              >
                <Icon as={X} size={17} className="text-muted-foreground" />
              </Pressable>
            </View>
            <TextInput
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="Họ và tên *"
              placeholderTextColor="#888"
              className={MODERN_INPUT}
            />
            <TextInput
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              placeholder="Email *"
              placeholderTextColor="#888"
              autoCapitalize="none"
              className={MODERN_INPUT}
            />
            <TextInput
              value={newUserPhone}
              onChangeText={setNewUserPhone}
              placeholder="Số điện thoại"
              placeholderTextColor="#888"
              className={MODERN_INPUT}
            />
            <View className="flex-row gap-2">
              {(['customer', 'shop', 'specialist'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setNewUserRole(r)}
                  className={`flex-1 items-center rounded-full border py-2.5 active:scale-[0.98] ${
                    newUserRole === r ? 'border-primary bg-primary/15' : 'border-border/80 bg-surface-2'
                  }`}
                >
                  <Text className="text-[12px] font-semibold text-foreground">{ROLE_LABELS[r]}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              disabled={busyKey === 'add-user'}
              onPress={() => void handleCreateUser()}
              className="h-12 items-center justify-center rounded-[14px] bg-primary active:scale-[0.98]"
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">Tạo tài khoản</Text>
            </Pressable>
          </View>
        </BottomSheetFrame>
      </Modal>

      {/* Change Role Modal */}
      <Modal visible={editingRoleUser !== null} animationType="fade" transparent>
        <View className="flex-1 items-center justify-center bg-black/75 px-5">
          <View className="w-full max-w-sm rounded-[24px] border border-border/90 bg-card p-5 gap-3.5">
            <Text className="font-display text-[19px] font-normal text-foreground">
              Phân quyền: {editingRoleUser?.name}
            </Text>
            <View className="gap-2">
              {(['customer', 'shop', 'specialist'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setTargetRole(r)}
                  className={`rounded-[13px] border px-3.5 py-3 active:scale-[0.99] ${
                    targetRole === r ? 'border-primary bg-primary/15' : 'border-border/80 bg-surface-2'
                  }`}
                >
                  <Text className="text-[13.5px] font-medium text-foreground">{ROLE_LABELS[r]}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => setEditingRoleUser(null)}
                className="flex-1 items-center rounded-[13px] border border-border/80 py-3 active:scale-[0.98]"
              >
                <Text className="text-[13px] font-medium text-foreground">Hủy</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const target = editingRoleUser;
                  setEditingRoleUser(null);
                  if (target) {
                    void handlePatchUser(target, { role: targetRole }, `Đã đổi quyền ${target.name} thành ${ROLE_LABELS[targetRole]}`);
                  }
                }}
                className="flex-1 items-center rounded-[13px] bg-primary py-3 active:scale-[0.98]"
              >
                <Text className="text-[13px] font-semibold text-primary-foreground">Lưu</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
