import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import * as auth from '@/lib/auth';
import { RoleRouteGuard } from './role-route-guard';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

jest.mock('@/lib/auth', () => {
  const actual = jest.requireActual('@/lib/auth');
  return {
    ...actual,
    useCurrentUser: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
  };
});

describe('RoleRouteGuard (Web Route Parity)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows super admin into /admin route', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'admin-1',
      email: 'hattn.23itb@vku.udn.vn',
      role: 'customer',
      status: 'active',
    });

    await render(
      <RoleRouteGuard allowedRoles={['admin']} title="Admin">
        <Text>Admin Protected Content</Text>
      </RoleRouteGuard>,
    );

    expect(screen.getByText('Admin Protected Content')).toBeTruthy();
  });

  it('blocks customer from accessing /admin route just like Web 403', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'cust-1',
      email: 'khach@skinsense.vn',
      role: 'customer',
      status: 'active',
    });

    await render(
      <RoleRouteGuard allowedRoles={['admin']} title="Cổng Quản Trị Hệ Thống (Admin)">
        <Text>Admin Protected Content</Text>
      </RoleRouteGuard>,
    );

    expect(screen.queryByText('Admin Protected Content')).toBeNull();
    expect(screen.getByText('Không đủ quyền truy cập')).toBeTruthy();
  });

  it('blocks pending Shop partner from entering /shop seller center until Admin GPKD approval', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'shop-pending',
      email: 'pending@shop.vn',
      role: 'shop',
      status: 'pending',
      fullName: 'Pending Shop',
    });

    await render(
      <RoleRouteGuard allowedRoles={['shop', 'admin']} title="Kênh Người Bán (Shop)">
        <Text>Shop Protected Content</Text>
      </RoleRouteGuard>,
    );

    expect(screen.queryByText('Shop Protected Content')).toBeNull();
    expect(screen.getByText('Không đủ quyền truy cập')).toBeTruthy();
    expect(screen.getByText(/đang chờ Super Admin/i)).toBeTruthy();
  });

  it('allows approved specialist into /specialist portal', async () => {
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'doc-1',
      email: 'bacsi@skinsense.vn',
      role: 'specialist',
      status: 'active',
    });

    await render(
      <RoleRouteGuard allowedRoles={['specialist', 'admin']} title="Cổng Bác Sĩ Chuyên Khoa">
        <Text>Doctor Protected Content</Text>
      </RoleRouteGuard>,
    );

    expect(screen.getByText('Doctor Protected Content')).toBeTruthy();
  });
});
