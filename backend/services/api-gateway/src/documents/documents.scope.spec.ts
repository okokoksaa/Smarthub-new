import { DocumentsService } from './documents.service';

describe('DocumentsService scope isolation', () => {
  const config: any = { get: jest.fn((k: string) => (k === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'test-key')) };

  it('filters documents list by province scope', async () => {
    const svc = new DocumentsService(config);
    (svc as any).supabase = {
      from: () => ({
        select: () => ({
          order: () => ({
            range: () => Promise.resolve({
              data: [
                { id: '1', constituency: { district: { province: { name: 'Lusaka' } } } },
                { id: '2', constituency: { district: { province: { name: 'Eastern' } } } },
              ],
              count: 2,
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const out = await svc.findAll({}, {
      level: 'province',
      provinceName: 'Lusaka',
      normalizedScope: 'Lusaka Province',
      source: 'query.scope',
      rawScope: 'Lusaka',
    });

    expect(out.documents).toHaveLength(1);
    expect((out.documents[0] as any).id).toBe('1');
  });
});
