import { http, HttpResponse } from 'msw';

// Mock data based on the Project interface in api/projects.ts
const mockProjects = [
  {
    project_id: 'MSW-001',
    project_name: 'Mock: Kabwata Community Hall Renovation',
    constituency_id: 156,
    ward_id: 1,
    status: 'IMPLEMENTATION',
    budget: 1250000,
  },
  {
    project_id: 'MSW-002',
    project_name: 'Mock: Lusaka Central Water Borehole',
    constituency_id: 156,
    ward_id: 2,
    status: 'APPROVED',
    budget: 750000,
  },
  {
    project_id: 'MSW-003',
    project_name: 'Mock: Chawama Youth Skills Center Equipment',
    constituency_id: 156,
    ward_id: 3,
    status: 'COMPLETED',
    budget: 500000,
  },
];

export const handlers = [
  // Intercept GET requests to /api/projects
  http.get('/api/projects', ({ request }) => {
    const url = new URL(request.url);
    const constituencyId = url.searchParams.get('constituency_id');

    if (constituencyId === '156') {
      // Return a successful response with the mock projects
      return HttpResponse.json(mockProjects);
    }

    // If the constituency ID doesn't match, return an empty array
    return HttpResponse.json([]);
  }),
];
