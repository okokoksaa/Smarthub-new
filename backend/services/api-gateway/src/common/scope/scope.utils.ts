import { ScopeContext } from './scope-context';

function normalizeProvinceName(value: string): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  const withoutSuffix = cleaned.replace(/\s+province$/i, '');
  return withoutSuffix
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function resolveScopeContext(scopeParam?: string, constituencyHeader?: string): ScopeContext {
  const raw = (scopeParam || constituencyHeader || '').trim();

  if (!raw || /^national\s*\(all\)$/i.test(raw) || /^national$/i.test(raw)) {
    return {
      rawScope: raw || undefined,
      normalizedScope: 'National (All)',
      level: 'national',
      source: scopeParam ? 'query.scope' : constituencyHeader ? 'header.x-constituency-id' : 'default',
    };
  }

  // Province can be provided as "Lusaka Province" or just "Lusaka"
  const provinceName = normalizeProvinceName(raw);
  if (provinceName) {
    return {
      rawScope: raw,
      normalizedScope: `${provinceName} Province`,
      level: 'province',
      provinceName,
      source: scopeParam ? 'query.scope' : 'header.x-constituency-id',
    };
  }

  // Final fallback
  return {
    rawScope: raw,
    normalizedScope: 'National (All)',
    level: 'national',
    source: scopeParam ? 'query.scope' : 'header.x-constituency-id',
  };
}

export function matchesProvince(record: any, provinceName: string): boolean {
  const normalizedTarget = provinceName.toLowerCase();
  const candidates = [
    record?.province,
    record?.province_name,
    record?.provinceName,
    record?.constituency?.district?.province?.name,
    record?.constituency?.districts?.provinces?.name,
    record?.district?.province?.name,
    record?.districts?.provinces?.name,
    record?.project?.constituency?.district?.province?.name,
    record?.project?.constituency?.districts?.provinces?.name,
    record?.committee?.province?.name,
    record?.committee?.constituency?.district?.province?.name,
  ]
    .filter(Boolean)
    .map((v: string) => String(v).toLowerCase().replace(/\s+province$/i, '').trim());

  return candidates.includes(normalizedTarget.toLowerCase());
}

export function applyScopeToRows<T = any>(rows: T[] | null | undefined, scope?: ScopeContext): T[] {
  if (!rows || !Array.isArray(rows) || !scope || scope.level === 'national' || !scope.provinceName) {
    return rows || [];
  }

  return rows.filter((row: any) => matchesProvince(row, scope.provinceName!));
}
