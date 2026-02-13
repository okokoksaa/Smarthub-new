import { PublicController } from './public.controller';

describe('PublicController scope propagation', () => {
  it('passes req.scopeContext to getProjects', async () => {
    const service: any = { getProjects: jest.fn().mockResolvedValue({ data: [] }) };
    const controller = new PublicController(service);
    await controller.getProjects(undefined, undefined, undefined, 1, 20, { scopeContext: { level: 'province' } } as any);
    expect(service.getProjects).toHaveBeenCalledWith(expect.objectContaining({ scopeContext: { level: 'province' } }));
  });
});