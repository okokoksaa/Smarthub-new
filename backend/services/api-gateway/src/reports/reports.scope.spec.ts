import { ReportsService } from './reports.service';

describe('ReportsService scope isolation', () => {
  const config: any = { get: jest.fn((k: string) => (k === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'test-key')) };

  it('filters project status report to province scope', async () => {
    const svc = new ReportsService(config);
    (svc as any).supabase = {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    } as any;

    jest.spyOn((svc as any).supabase, 'from').mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({
          data: [
            { id: '1', name: 'P1', status: 'approved', project_type: 'water', approved_amount: 10, progress_percentage: 0, created_at: '2026-01-01', constituencies: { name: 'A' }, constituency: { district: { province: { name: 'Lusaka' } } } },
            { id: '2', name: 'P2', status: 'approved', project_type: 'water', approved_amount: 10, progress_percentage: 0, created_at: '2026-01-01', constituencies: { name: 'B' }, constituency: { district: { province: { name: 'Copperbelt' } } } },
          ],
        }),
      }),
    } as any);

    const out = await svc.getProjectStatusReport(undefined, {
      level: 'province',
      provinceName: 'Lusaka',
      normalizedScope: 'Lusaka Province',
      source: 'query.scope',
      rawScope: 'Lusaka',
    });

    expect(out.total_projects).toBe(1);
    expect(out.projects[0].id).toBe('1');
  });
});
