import { applyScopeToRows, matchesProvince, resolveScopeContext } from './scope.utils';

describe('Scope utils', () => {
  describe('resolveScopeContext', () => {
    it('defaults to national when no scope is provided', () => {
      const ctx = resolveScopeContext();
      expect(ctx.level).toBe('national');
      expect(ctx.normalizedScope).toBe('National (All)');
    });

    it('normalizes province names from header/query', () => {
      const ctx = resolveScopeContext('  lusaka province ');
      expect(ctx.level).toBe('province');
      expect(ctx.provinceName).toBe('Lusaka');
      expect(ctx.normalizedScope).toBe('Lusaka Province');
    });
  });

  describe('matchesProvince', () => {
    it('matches province on direct field', () => {
      expect(matchesProvince({ province: 'Lusaka' }, 'Lusaka')).toBe(true);
    });

    it('matches nested province path', () => {
      expect(matchesProvince({ constituency: { district: { province: { name: 'Copperbelt' } } } }, 'Copperbelt')).toBe(true);
    });

    it('does not match different province', () => {
      expect(matchesProvince({ province: 'Eastern' }, 'Lusaka')).toBe(false);
    });
  });

  describe('applyScopeToRows', () => {
    const rows = [
      { id: '1', province: 'Lusaka', tenantId: 'tenant-a' },
      { id: '2', province: 'Copperbelt', tenantId: 'tenant-b' },
      { id: '3', constituency: { district: { province: { name: 'Lusaka' } } }, tenantId: 'tenant-a' },
    ];

    it('returns all rows for national scope', () => {
      const scoped = applyScopeToRows(rows, { level: 'national', normalizedScope: 'National (All)', source: 'default' });
      expect(scoped).toHaveLength(3);
    });

    it('returns province rows only for province scope', () => {
      const scoped = applyScopeToRows(rows, {
        level: 'province',
        provinceName: 'Lusaka',
        rawScope: 'Lusaka',
        normalizedScope: 'Lusaka Province',
        source: 'query.scope',
      });
      expect(scoped).toHaveLength(2);
      expect(scoped.map((r: any) => r.id)).toEqual(['1', '3']);
    });

    it('prevents cross-tenant leakage under scoped access', () => {
      const scoped = applyScopeToRows(rows, {
        level: 'province',
        provinceName: 'Lusaka',
        rawScope: 'Lusaka',
        normalizedScope: 'Lusaka Province',
        source: 'header.x-constituency-id',
      });
      expect(scoped.some((r: any) => r.tenantId === 'tenant-b')).toBe(false);
    });
  });
});
