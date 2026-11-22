import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  apiJson,
  fetchApprovedMarketplaceProducts,
  prescribeSpecialistCaseRemote,
  savePersonalRoutineRemote,
  submitClinicalRecordRemote,
  updateSpecialistCaseStatusRemote,
} from './api';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { access_token: 'mock-jwt-token' } },
      })),
    },
  },
}));

describe('Mobile Backend API Client (api.ts)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('attaches Bearer token from Supabase session to apiJson requests', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, ping: 1 }),
    })) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const res = await apiJson<{ ok: boolean; ping: number }>('/api/routine');
    expect(res.ok).toBe(true);
    expect(res.data?.ping).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/routine$/),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
        }),
      }),
    );
  });

  it('filters approved marketplace products from GET /api/admin/products', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        products: [
          { id: 'p1', name: 'Serum B5', shopName: 'Shop A', price: 390000, status: 'approved' },
          { id: 'p2', name: 'Pending Cream', shopName: 'Shop B', price: 200000, status: 'pending' },
        ],
      }),
    })) as unknown as typeof fetch;

    const list = await fetchApprovedMarketplaceProducts();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('p1');
  });

  it('persists custom routine via PUT /api/routine and stores clinical cases locally on offline fallback', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, savedCount: 2, protocolProductIds: ['sp_01', 'sp_03'] }),
    })) as unknown as typeof fetch;

    const saved = await savePersonalRoutineRemote({
      routineTitle: 'Routine Test',
      products: [{ id: 'sp_01', name: 'Cleanser' }, { id: 'sp_03', name: 'Serum B5' }],
    });
    expect(saved.ok).toBe(true);
    expect(saved.data?.savedCount).toBe(2);

    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;

    const offlineRecord = await submitClinicalRecordRemote({
      patientName: 'Test User',
      symptoms: 'Đỏ nhẹ vùng má',
      rednessIndex: 35,
      spotsCount: 2,
    });
    expect(offlineRecord.ok).toBe(true);
    expect(offlineRecord.offline).toBe(true);
    expect(offlineRecord.caseCode).toMatch(/^BA-LOCAL-/);
  });

  it('forwards specialist prescribe (POST) and completion status (PATCH) requests', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, case: { id: 'case_01', status: 'completed' } }),
    })) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const rx = await prescribeSpecialistCaseRemote({
      caseId: 'case_01',
      routineTitle: 'Phác đồ phục hồi',
      doctorNotes: 'Dùng đều 14 ngày',
      products: [{ id: 'p1', name: 'CeraVe' }],
    });
    expect(rx.ok).toBe(true);

    const patch = await updateSpecialistCaseStatusRemote('case_01', 'completed');
    expect(patch.ok).toBe(true);
    expect(patch.data?.case?.status).toBe('completed');
  });
});
