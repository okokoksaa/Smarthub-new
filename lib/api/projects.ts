import { apiClient, apiRequest, paginatedApiRequest, PaginatedResponse, ApiResponse } from '../api-client';

// Project types
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  budget: {
    total: number;
    allocated: number;
    spent: number;
    remaining: number;
  };
  timeline: {
    startDate: string;
    endDate: string;
    estimatedDuration: number;
  };
  location: {
    ward?: string;
    constituency: string;
    district?: string;
    province?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  beneficiaries: {
    direct: number;
    indirect: number;
    demographics: {
      male: number;
      female: number;
      youth: number;
      elderly: number;
    };
  };
  contractor?: {
    id: string;
    name: string;
    contactInfo: string;
  };
  progress: number;
  milestones: ProjectMilestone[];
  documents: ProjectDocument[];
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number;
  budget: number;
  deliverables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  budget: {
    total: number;
  };
  timeline: {
    startDate: string;
    endDate: string;
  };
  location: {
    ward?: string;
    constituency: string;
    district?: string;
    province?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  beneficiaries: {
    direct: number;
    indirect: number;
    demographics: {
      male: number;
      female: number;
      youth: number;
      elderly: number;
    };
  };
  contractorId?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  budget?: {
    total?: number;
    allocated?: number;
    spent?: number;
  };
  timeline?: {
    startDate?: string;
    endDate?: string;
  };
  beneficiaries?: {
    direct?: number;
    indirect?: number;
    demographics?: {
      male?: number;
      female?: number;
      youth?: number;
      elderly?: number;
    };
  };
  contractorId?: string;
  progress?: number;
}

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  constituency?: string;
  ward?: string;
  district?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProjectStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  totalBudget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  completion: {
    completed: number;
    inProgress: number;
    pending: number;
  };
}

// Projects API class
export class ProjectsApi {
  // Get all projects with filtering and pagination
  static async getProjects(params?: ProjectQueryParams): Promise<{
    data: Project[];
    pagination: any;
  }> {
    return paginatedApiRequest(() =>
      apiClient.get<PaginatedResponse<Project>>('/projects', { params })
    );
  }

  // Get single project by ID
  static async getProject(id: string): Promise<Project> {
    return apiRequest(() =>
      apiClient.get<ApiResponse<Project>>(`/projects/${id}`)
    );
  }

  // Create new project
  static async createProject(data: CreateProjectRequest): Promise<Project> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<Project>>('/projects', data)
    );
  }

  // Update existing project
  static async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    return apiRequest(() =>
      apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data)
    );
  }

  // Delete project
  static async deleteProject(id: string): Promise<void> {
    return apiRequest(() =>
      apiClient.delete<ApiResponse<void>>(`/projects/${id}`)
    );
  }

  // Approve project
  static async approveProject(id: string, comments?: string): Promise<Project> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<Project>>(`/projects/${id}/approve`, { comments })
    );
  }

  // Reject project
  static async rejectProject(id: string, reason: string): Promise<Project> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<Project>>(`/projects/${id}/reject`, { reason })
    );
  }

  // Update project progress
  static async updateProgress(id: string, progress: number, notes?: string): Promise<Project> {
    return apiRequest(() =>
      apiClient.patch<ApiResponse<Project>>(`/projects/${id}/progress`, {
        progress,
        notes
      })
    );
  }

  // Get project statistics
  static async getProjectStats(params?: {
    constituency?: string;
    ward?: string;
    district?: string;
    province?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ProjectStats> {
    return apiRequest(() =>
      apiClient.get<ApiResponse<ProjectStats>>('/projects/stats', { params })
    );
  }

  // Milestone methods
  static async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    return apiRequest(() =>
      apiClient.get<ApiResponse<ProjectMilestone[]>>(`/projects/${projectId}/milestones`)
    );
  }

  static async createMilestone(projectId: string, data: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<ProjectMilestone>>(`/projects/${projectId}/milestones`, data)
    );
  }

  static async updateMilestone(projectId: string, milestoneId: string, data: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    return apiRequest(() =>
      apiClient.patch<ApiResponse<ProjectMilestone>>(`/projects/${projectId}/milestones/${milestoneId}`, data)
    );
  }

  static async completeMilestone(projectId: string, milestoneId: string): Promise<ProjectMilestone> {
    return apiRequest(() =>
      apiClient.post<ApiResponse<ProjectMilestone>>(`/projects/${projectId}/milestones/${milestoneId}/complete`)
    );
  }

  // Document methods
  static async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return apiRequest(() =>
      apiClient.get<ApiResponse<ProjectDocument[]>>(`/projects/${projectId}/documents`)
    );
  }

  static async uploadDocument(projectId: string, file: File, type: string): Promise<ProjectDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return apiRequest(() =>
      apiClient.post<ApiResponse<ProjectDocument>>(`/projects/${projectId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
  }

  static async deleteDocument(projectId: string, documentId: string): Promise<void> {
    return apiRequest(() =>
      apiClient.delete<ApiResponse<void>>(`/projects/${projectId}/documents/${documentId}`)
    );
  }
}

// Default export
export default ProjectsApi;