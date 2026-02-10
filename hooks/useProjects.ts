import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectsApi, Project, ProjectQueryParams, CreateProjectRequest, UpdateProjectRequest } from '../lib/api/projects';

/**
 * Hook to fetch projects with filtering and pagination
 */
export const useProjects = (params?: ProjectQueryParams) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => ProjectsApi.getProjects(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

/**
 * Hook to fetch a single project by ID
 */
export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => ProjectsApi.getProject(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new project
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => ProjectsApi.createProject(data),
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

/**
 * Hook to update a project
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      ProjectsApi.updateProject(id, data),
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(['project', updatedProject.id], updatedProject);
      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

/**
 * Hook to approve a project
 */
export const useApproveProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      ProjectsApi.approveProject(id, comments),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', updatedProject.id], updatedProject);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

/**
 * Hook to reject a project
 */
export const useRejectProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ProjectsApi.rejectProject(id, reason),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', updatedProject.id], updatedProject);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

/**
 * Hook to update project progress
 */
export const useUpdateProjectProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, progress, notes }: { id: string; progress: number; notes?: string }) =>
      ProjectsApi.updateProgress(id, progress, notes),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', updatedProject.id], updatedProject);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

/**
 * Hook to fetch project statistics
 */
export const useProjectStats = (params?: {
  constituency?: string;
  ward?: string;
  district?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['project-stats', params],
    queryFn: () => ProjectsApi.getProjectStats(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch project milestones
 */
export const useProjectMilestones = (projectId: string) => {
  return useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => ProjectsApi.getProjectMilestones(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch project documents
 */
export const useProjectDocuments = (projectId: string) => {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: () => ProjectsApi.getProjectDocuments(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to upload project document
 */
export const useUploadProjectDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, file, type }: { projectId: string; file: File; type: string }) =>
      ProjectsApi.uploadDocument(projectId, file, type),
    onSuccess: (_, variables) => {
      // Refetch documents for this project
      queryClient.invalidateQueries({ queryKey: ['project-documents', variables.projectId] });
    },
  });
};
