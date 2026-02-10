import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type ProjectDocument = {
  id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  is_immutable: boolean;
  created_at: string;
};

export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'cdfc_review'
  | 'tac_appraisal'
  | 'plgo_review'
  | 'approved'
  | 'implementation'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ProjectType =
  | 'infrastructure'
  | 'education'
  | 'health'
  | 'water_sanitation'
  | 'agriculture'
  | 'skills_training'
  | 'community_development'
  | 'other';

export interface Project {
  id: string;
  project_number: string;
  name: string;
  description: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  constituency_id: string;
  ward_id: string | null;
  estimated_cost: number;
  approved_amount: number | null;
  progress_percentage: number;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  submitter_id: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  contractor_id: string | null;
  beneficiary_count: number | null;
  location_description: string | null;
  gps_coordinates: { lat: number; lng: number } | null;
  created_at: string;
  updated_at: string;
  constituency?: {
    id: string;
    name: string;
    code: string;
  };
  ward?: {
    id: string;
    name: string;
    code: string;
  };
  documents?: ProjectDocument[];
}

export interface CreateProjectData {
  name: string;
  description?: string;
  project_type: ProjectType;
  constituency_id: string;
  ward_id?: string;
  estimated_cost: number;
  start_date?: string;
  expected_end_date?: string;
  beneficiary_count?: number;
  location_description?: string;
  gps_coordinates?: { lat: number; lng: number };
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  project_type?: ProjectType;
  ward_id?: string;
  estimated_cost?: number;
  approved_amount?: number;
  start_date?: string;
  expected_end_date?: string;
  beneficiary_count?: number;
  location_description?: string;
  gps_coordinates?: { lat: number; lng: number };
  contractor_id?: string;
}

export interface ProjectFilters {
  constituency_id?: string;
  ward_id?: string;
  status?: ProjectStatus;
  project_type?: ProjectType;
  page?: number;
  limit?: number;
}

// Hook to get all projects with filters
export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.constituency_id) params.append("constituency_id", filters.constituency_id);
      if (filters.ward_id) params.append("ward_id", filters.ward_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.project_type) params.append("project_type", filters.project_type);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));

      const { data } = await api.get(`/projects?${params.toString()}`);
      return data.data as Project[];
    },
  });
}

// Hook to get a single project by ID
export function useProject(projectId?: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await api.get(`/projects/${projectId}`);
      return data.data as Project;
    },
    enabled: !!projectId,
  });
}

// Hook to get projects by status
export function useProjectsByStatus(status: ProjectStatus) {
  return useQuery({
    queryKey: ["projects", "status", status],
    queryFn: async () => {
      const { data } = await api.get(`/projects?status=${status}`);
      return data.data as Project[];
    },
  });
}

// Hook to get projects for a constituency
export function useConstituencyProjects(constituencyId?: string) {
  return useQuery({
    queryKey: ["projects", "constituency", constituencyId],
    queryFn: async () => {
      if (!constituencyId) return [];
      const { data } = await api.get(`/projects?constituency_id=${constituencyId}`);
      return data.data as Project[];
    },
    enabled: !!constituencyId,
  });
}

// Hook to create a new project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData: CreateProjectData) => {
      const { data } = await api.post("/projects", projectData);
      return data.data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Project "${data.name}" created successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create project";
      toast.error(message);
    },
  });
}

// Hook to update a project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data: updateData }: { projectId: string; data: UpdateProjectData }) => {
      const { data } = await api.patch(`/projects/${projectId}`, updateData);
      return data.data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
      toast.success("Project updated successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update project";
      toast.error(message);
    },
  });
}

// Hook to delete a project (only draft projects)
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to delete project";
      toast.error(message);
    },
  });
}

// Hook to assign contractor to project
export function useAssignContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, contractorId }: { projectId: string; contractorId: string }) => {
      const { data } = await api.patch(`/projects/${projectId}`, { contractor_id: contractorId });
      return data.data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
      toast.success("Contractor assigned successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to assign contractor";
      toast.error(message);
    },
  });
}
