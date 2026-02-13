import { MonitoringController } from './monitoring.controller';

describe('MonitoringController scope propagation', () => {
  it('passes req.scopeContext to getIssues', async () => {
    const service: any = { getIssues: jest.fn().mockResolvedValue({ data: [] }) };
    const controller = new MonitoringController(service);
    await controller.getIssues('p1', 'open', 'high', 1, 10, { scopeContext: { level: 'province' } } as any);
    expect(service.getIssues).toHaveBeenCalledWith('p1', { status: 'open', severity: 'high', page: 1, limit: 10 }, { level: 'province' });
  });
});