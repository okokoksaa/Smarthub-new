import { MinistryController } from './ministry.controller';

describe('MinistryController scope propagation', () => {
  it('passes req.scopeContext to service', async () => {
    const service: any = { getCAPRCycles: jest.fn().mockResolvedValue([]) };
    const controller = new MinistryController(service);
    await controller.getCAPRCycles(undefined, '2026', undefined, { scopeContext: { level: 'province' } } as any);
    expect(service.getCAPRCycles).toHaveBeenCalledWith(undefined, '2026', undefined, { level: 'province' });
  });
});