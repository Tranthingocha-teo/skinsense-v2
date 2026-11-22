import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import * as picker from 'expo-image-picker';

import * as api from '@/lib/api';
import * as auth from '@/lib/auth';
import { RoleProfileScreen } from './role-profile';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() },
}));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('@/lib/auth', () => ({
  useCurrentUser: jest.fn(),
  setCurrentUser: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn().mockResolvedValue(undefined),
  getRouteForRole: jest.fn(() => '/specialist'),
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    loadRoleProfileRemote: jest.fn(),
    saveRoleProfileRemote: jest.fn(),
    loadAdminRoutinesRemote: jest.fn(),
    tickAdminRoutineRemote: jest.fn(),
    uploadImageRemote: jest.fn(),
  };
});

describe('RoleProfileScreen (Native Profile & Allocated Routine)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth.useCurrentUser as jest.Mock).mockReturnValue({
      id: 'spec-1',
      email: 'bacsi@skinsense.vn',
      role: 'specialist',
      status: 'active',
      fullName: 'BS. Lê Lan',
      phoneNumber: '0901112223',
      hospital: 'BV Da Liễu Đà Nẵng',
      licenseId: 'CCHN-555666',
      specialty: 'Da liễu lâm sàng',
    });

    (api.loadRoleProfileRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        user: {
          id: 'spec-1',
          email: 'bacsi@skinsense.vn',
          role: 'specialist',
          fullName: 'BS. Lê Lan',
          phone: '0901112223',
          specialist: {
            hospital: 'BV Da Liễu Đà Nẵng',
            licenseNumber: 'CCHN-555666',
            specialty: 'Da liễu lâm sàng',
          },
        },
      },
    });

    (api.loadAdminRoutinesRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        routine: {
          role: 'specialist',
          title: 'Quy trình Chuyên môn Bác sĩ Da liễu',
          description: 'Checklist duyệt phác đồ bệnh nhân hàng ngày',
          targetUser: 'bacsi@skinsense.vn',
          allocatedBy: 'Super Admin',
          treatmentDuration: '30 ngày',
          skinConcern: 'Kiểm soát mụn',
          steps: [
            {
              id: 'step-1',
              stepNumber: 1,
              label: 'Đọc ảnh chụp lâm sàng vùng má',
              productName: 'SkinSense AI Dermaview',
              brand: 'SkinSense',
              category: 'Chuyên môn',
              activeIngredients: 'Clean Architecture',
              stepTime: 'morning',
              dosage: '08:30',
              usageGuide: 'Kiểm tra độ nét ảnh trước khi kê đơn',
              isCompleted: false,
            },
          ],
        },
      },
    });

    (api.saveRoleProfileRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ok: true, message: 'Đã cập nhật hồ sơ thành công!' },
    });

    (api.tickAdminRoutineRemote as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        routine: {
          role: 'specialist',
          title: 'Quy trình Chuyên môn Bác sĩ Da liễu',
          description: 'Checklist duyệt phác đồ bệnh nhân hàng ngày',
          targetUser: 'bacsi@skinsense.vn',
          allocatedBy: 'Super Admin',
          treatmentDuration: '30 ngày',
          skinConcern: 'Kiểm soát mụn',
          steps: [
            {
              id: 'step-1',
              stepNumber: 1,
              label: 'Đọc ảnh chụp lâm sàng vùng má',
              productName: 'SkinSense AI Dermaview',
              brand: 'SkinSense',
              category: 'Chuyên môn',
              activeIngredients: 'Clean Architecture',
              stepTime: 'morning',
              dosage: '08:30',
              usageGuide: 'Kiểm tra độ nét ảnh trước khi kê đơn',
              isCompleted: true,
            },
          ],
        },
      },
    });
  });

  it('loads role metadata + allocated routine, edits full name, saves profile, and ticks routine step', async () => {
    await render(<RoleProfileScreen />);

    expect((await screen.findAllByText('BS. Lê Lan')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CCHN-555666')).toBeTruthy();
    expect(screen.getByText('Quy trình Chuyên môn Bác sĩ Da liễu')).toBeTruthy();
    expect(api.loadRoleProfileRemote).toHaveBeenCalledWith('specialist');
    expect(api.loadAdminRoutinesRemote).toHaveBeenCalledWith('specialist');

    await fireEvent.press(screen.getByText('Chỉnh sửa'));
    await fireEvent.changeText(screen.getByDisplayValue('BS. Lê Lan'), 'TS. BS. Lê Lan');
    await fireEvent.press(screen.getByText('Lưu thay đổi hồ sơ'));

    await waitFor(() => {
      expect(api.saveRoleProfileRemote).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'spec-1',
          role: 'specialist',
          fullName: 'TS. BS. Lê Lan',
          specialist: expect.objectContaining({
            hospital: 'BV Da Liễu Đà Nẵng',
            licenseNumber: 'CCHN-555666',
          }),
        }),
      );
      expect(auth.setCurrentUser).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'TS. BS. Lê Lan',
        }),
      );
    });

    expect(await screen.findByText('Đã cập nhật hồ sơ thành công!')).toBeTruthy();

    await fireEvent.press(screen.getByText(/1\. Đọc ảnh chụp lâm sàng vùng má/));
    await waitFor(() => {
      expect(api.tickAdminRoutineRemote).toHaveBeenCalledWith('specialist', 'step-1', true);
    });
  });

  describe('avatar on Cloudinary', () => {
    const CLOUD = 'https://res.cloudinary.com/demo/image/upload/v1/avatars/me.jpg';
    const pick = picker.launchImageLibraryAsync as jest.Mock;
    const perm = picker.requestMediaLibraryPermissionsAsync as jest.Mock;
    const upload = api.uploadImageRemote as jest.Mock;

    it('hides the change-photo control until the profile is in edit mode', async () => {
      await render(<RoleProfileScreen />);
      await screen.findByText('Chỉnh sửa');
      expect(screen.queryByText('Đổi ảnh')).toBeNull();
      await fireEvent.press(screen.getByText('Chỉnh sửa'));
      expect(screen.getByText('Đổi ảnh')).toBeTruthy();
    });

    it('picks an image, uploads it to the avatars folder and saves the link as avatarUrl', async () => {
      perm.mockResolvedValue({ granted: true });
      pick.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///picked.jpg' }] });
      upload.mockResolvedValue({ ok: true, url: CLOUD });

      await render(<RoleProfileScreen />);
      await fireEvent.press(await screen.findByText('Chỉnh sửa'));
      await fireEvent.press(screen.getByText('Đổi ảnh'));

      await waitFor(() => expect(upload).toHaveBeenCalledWith({ uri: 'file:///picked.jpg', folder: 'avatars' }));
      await fireEvent.press(screen.getByText('Lưu thay đổi hồ sơ'));

      await waitFor(() => expect(api.saveRoleProfileRemote).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: CLOUD })));
      expect(auth.setCurrentUser).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: CLOUD }));
    });

    it('does not upload when the photo-library permission is refused', async () => {
      perm.mockResolvedValue({ granted: false });
      await render(<RoleProfileScreen />);
      await fireEvent.press(await screen.findByText('Chỉnh sửa'));
      await fireEvent.press(screen.getByText('Đổi ảnh'));
      expect(await screen.findByText(/quyền thư viện ảnh/)).toBeTruthy();
      expect(upload).not.toHaveBeenCalled();
    });

    it('does not upload when the picker is cancelled', async () => {
      perm.mockResolvedValue({ granted: true });
      pick.mockResolvedValue({ canceled: true, assets: [] });
      await render(<RoleProfileScreen />);
      await fireEvent.press(await screen.findByText('Chỉnh sửa'));
      await fireEvent.press(screen.getByText('Đổi ảnh'));
      await waitFor(() => expect(pick).toHaveBeenCalled());
      expect(upload).not.toHaveBeenCalled();
    });

    it('shows the upload error and keeps no avatarUrl when the upload fails', async () => {
      perm.mockResolvedValue({ granted: true });
      pick.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///picked.jpg' }] });
      upload.mockResolvedValue({ ok: false, error: 'HTTP 503' });
      await render(<RoleProfileScreen />);
      await fireEvent.press(await screen.findByText('Chỉnh sửa'));
      await fireEvent.press(screen.getByText('Đổi ảnh'));
      expect(await screen.findByText('HTTP 503')).toBeTruthy();
      await fireEvent.press(screen.getByText('Lưu thay đổi hồ sơ'));
      await waitFor(() => expect(api.saveRoleProfileRemote).toHaveBeenCalled());
      expect((api.saveRoleProfileRemote as jest.Mock).mock.calls[0][0].avatarUrl).toBeUndefined();
    });
  });
});
