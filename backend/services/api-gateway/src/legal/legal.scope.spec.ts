import { LegalController } from './legal.controller';

describe('LegalController scope propagation', () => {
  it('passes req.scopeContext to contracts service path', async () => {
    const service: any = { getContracts: jest.fn().mockResolvedValue([]) };
    const controller = new LegalController(service);
    await controller.getContracts(undefined, undefined, undefined, { scopeContext: { level: 'province' } } as any);
    expect(service.getContracts).toHaveBeenCalledWith(undefined, undefined, undefined, { level: 'province' });
  });
});