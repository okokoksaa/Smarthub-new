import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

const PUBLIC_API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000/api/v1';

// Public API client (no auth required)
const publicApi = axios.create({
  baseURL: PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PublicProject {
  id: string;
  name: string;
  description: string;
  constituency_name: string;
  ward_name: string;
  sector: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  expected_completion: string;
}

export interface ConstituencyStats {
  id: string;
  name: string;
  code: string;
  province: string;
  total_projects: number;
  completed_projects: number;
  total_budget: number;
  disbursed_amount: number;
  utilization_rate: number;
}

export interface NationalStats {
  total_constituencies: number;
  total_projects: number;
  projects_by_status: {
    approved: number;
    implementation: number;
    completed: number;
  };
  total_budget_allocated: number;
  total_disbursed: number;
  national_utilization_rate: number;
  projects_by_sector: Array<{
    sector: string;
    count: number;
    budget: number;
  }>;
  top_performing_constituencies: Array<{
    name: string;
    completion_rate: number;
    utilization_rate: number;
  }>;
}

export interface FeedbackSubmission {
  project_id?: string;
  constituency_id?: string;
  feedback_type: 'complaint' | 'suggestion' | 'inquiry' | 'appreciation';
  subject: string;
  message: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export function usePublicProjects(filters?: {
  constituencyId?: string;
  sector?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['public-projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.constituencyId) params.append('constituency_id', filters.constituencyId);
      if (filters?.sector) params.append('sector', filters.sector);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await publicApi.get(`/public/projects?${params.toString()}`);
      return response.data as {
        data: PublicProject[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    },
  });
}

export function usePublicProject(id: string) {
  return useQuery({
    queryKey: ['public-project', id],
    queryFn: async () => {
      const response = await publicApi.get(`/public/projects/${id}`);
      return response.data as PublicProject & {
        milestones: Array<{
          title: string;
          status: string;
          completion_date: string;
        }>;
      };
    },
    enabled: !!id,
  });
}

export function usePublicConstituencies() {
  return useQuery({
    queryKey: ['public-constituencies'],
    queryFn: async () => {
      const response = await publicApi.get('/public/constituencies');
      return response.data as ConstituencyStats[];
    },
  });
}

export function useConstituencyStats(constituencyId: string) {
  return useQuery({
    queryKey: ['constituency-stats', constituencyId],
    queryFn: async () => {
      const response = await publicApi.get(`/public/constituencies/${constituencyId}/stats`);
      return response.data as ConstituencyStats & {
        projects_by_sector: Array<{ sector: string; count: number; budget: number }>;
        projects_by_status: Array<{ status: string; count: number }>;
        budget_by_year: Array<{ year: number; allocated: number; disbursed: number }>;
      };
    },
    enabled: !!constituencyId,
  });
}

export function useNationalStats() {
  return useQuery({
    queryKey: ['national-stats'],
    queryFn: async () => {
      const response = await publicApi.get('/public/stats/national');
      return response.data as NationalStats;
    },
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async (data: FeedbackSubmission) => {
      const response = await publicApi.post('/public/feedback', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Feedback submitted successfully. Thank you!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    },
  });
}

export function useVerifyDocument(referenceNumber: string) {
  return useQuery({
    queryKey: ['verify-document', referenceNumber],
    queryFn: async () => {
      const response = await publicApi.get(`/public/verify/${referenceNumber}`);
      return response.data as {
        valid: boolean;
        document_type: string;
        issued_date: string;
        issuing_authority: string;
        details: any;
      };
    },
    enabled: !!referenceNumber && referenceNumber.length >= 10,
  });
}

export function useSearchProjects(searchTerm: string) {
  return useQuery({
    queryKey: ['search-projects', searchTerm],
    queryFn: async () => {
      const response = await publicApi.get(`/public/projects/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data as PublicProject[];
    },
    enabled: !!searchTerm && searchTerm.length >= 3,
  });
}
