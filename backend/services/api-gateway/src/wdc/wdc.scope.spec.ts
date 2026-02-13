import { WdcService } from './wdc.service';

describe('WdcService scope isolation', () => {
  const config: any = { get: jest.fn((k: string) => (k === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'test-key')) };

  it('hides signoff outside province scope', async () => {
    const svc = new WdcService(config);
    (svc as any).supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({
              data: { id: 's1', project: { constituency: { district: { province: { name: 'Eastern' } } } } },
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    await expect(
      svc.getSignoffByProject('p1', {
        level: 'province',
        provinceName: 'Lusaka',
        normalizedScope: 'Lusaka Province',
        source: 'query.scope',
        rawScope: 'Lusaka',
      }),
    ).rejects.toThrow('not found');
  });
});
