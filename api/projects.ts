import apiClient from './client';

// Define the type for a Project based on the PRD
// This is a simplified version for demonstration
export interface Project {
  project_id: string;
  project_name: string;
  constituency_id: number;
  ward_id: number;
  status: 'DRAFT' | 'SUBMITTED' | 'CDFC_REVIEW' | 'TAC_APPRAISAL' | 'PLGO_REVIEW' | 'APPROVED' | 'IMPLEMENTATION' | 'COMPLETED' | 'REJECTED';
  budget: number;
}

/**
 * Fetches all projects for a given constituency.
 * @param constituencyId The ID of the constituency.
 * @returns A promise that resolves to an array of projects.
 */
export const getProjectsByConstituency = (constituencyId: number): Promise<Project[]> => {
  return apiClient.get<Project[]>(`/projects?constituency_id=${constituencyId}`) as Promise<Project[]>;
};

/**
 * Fetches a single project by its ID.
 * @param projectId The ID of the project.
 * @returns A promise that resolves to a single project.
 */
export const getProjectById = (projectId: string): Promise<Project> => {
  return apiClient.get<Project>(`/projects/${projectId}`) as Promise<Project>;
};

/**
 * Creates a new project application.
 * @param projectData The data for the new project.
 * @returns A promise that resolves to the newly created project.
 */
export const createProject = (projectData: Omit<Project, 'project_id'>): Promise<Project> => {
  return apiClient.post<Project>('/projects', projectData) as Promise<Project>;
};
