export type ScopeLevel = 'national' | 'province';

export interface ScopeContext {
  rawScope?: string;
  normalizedScope: string;
  level: ScopeLevel;
  provinceName?: string;
  source: 'query.scope' | 'header.x-constituency-id' | 'default';
}

export interface ScopedRequest {
  scopeContext?: ScopeContext;
}
