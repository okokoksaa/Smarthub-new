import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Budget {
  id: string;
  constituency_id: string;
  fiscal_year: number;
  total_allocation: number;
  projects_allocation: number;
  bursaries_allocation: number;
  empowerment_allocation: number;
  admin_allocation: number;
  amount_disbursed: number;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  constituency?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateBudgetData {
  constituency_id: string;
  fiscal_year: number;
  total_allocation: number;
  projects_allocation?: number;
  bursaries_allocation?: number;
  empowerment_allocation?: number;
  admin_allocation?: number;
}

export interface UpdateBudgetData {
  total_allocation?: number;
  projects_allocation?: number;
  bursaries_allocation?: number;
  empowerment_allocation?: number;
  admin_allocation?: number;
}

export interface BudgetAnalytics {
  total_allocated: number;
  total_disbursed: number;
  utilization_rate: number;
  by_category: {
    projects: { allocated: number; disbursed: number };
    bursaries: { allocated: number; disbursed: number };
    empowerment: { allocated: number; disbursed: number };
    admin: { allocated: number; disbursed: number };
  };
}

// Hook to get all budgets
export function useBudgets(fiscalYear?: number) {
  return useQuery({
    queryKey: ["budgets", fiscalYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fiscalYear) params.append("fiscal_year", String(fiscalYear));

      const { data } = await api.get(`/budgets?${params.toString()}`);
      return data.data as Budget[];
    },
  });
}

// Hook to get budget by constituency
export function useBudgetByConstituency(constituencyId?: string, fiscalYear: number = new Date().getFullYear()) {
  return useQuery({
    queryKey: ["budget", constituencyId, fiscalYear],
    queryFn: async () => {
      if (!constituencyId) return null;
      const { data } = await api.get(`/budgets/constituency/${constituencyId}?fiscal_year=${fiscalYear}`);
      return data.data as Budget;
    },
    enabled: !!constituencyId,
  });
}

// Hook to get budget by ID
export function useBudget(budgetId?: string) {
  return useQuery({
    queryKey: ["budget", budgetId],
    queryFn: async () => {
      if (!budgetId) return null;
      const { data } = await api.get(`/budgets/${budgetId}`);
      return data.data as Budget;
    },
    enabled: !!budgetId,
  });
}

// Hook to get budget analytics
export function useBudgetAnalytics(constituencyId?: string, fiscalYear?: number) {
  return useQuery({
    queryKey: ["budgets", "analytics", constituencyId, fiscalYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (constituencyId) params.append("constituency_id", constituencyId);
      if (fiscalYear) params.append("fiscal_year", String(fiscalYear));

      const { data } = await api.get(`/budgets/analytics?${params.toString()}`);
      return data.data as BudgetAnalytics;
    },
  });
}

// Hook to create a new budget
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetData: CreateBudgetData) => {
      const { data } = await api.post("/budgets", budgetData);
      return data.data as Budget;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success(`Budget created for fiscal year ${data.fiscal_year}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create budget";
      toast.error(message);
    },
  });
}

// Hook to update a budget
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ budgetId, data: updateData }: { budgetId: string; data: UpdateBudgetData }) => {
      const { data } = await api.patch(`/budgets/${budgetId}`, updateData);
      return data.data as Budget;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget", data.id] });
      toast.success("Budget updated successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to update budget";
      toast.error(message);
    },
  });
}

// Hook to approve a budget
export function useApproveBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetId: string) => {
      const { data } = await api.post(`/budgets/${budgetId}/approve`);
      return data.data as Budget;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget", data.id] });
      toast.success("Budget approved successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to approve budget";
      toast.error(message);
    },
  });
}

// Hook to record a disbursement against a budget
export function useRecordDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ budgetId, amount, category }: { budgetId: string; amount: number; category: string }) => {
      const { data } = await api.post(`/budgets/${budgetId}/disburse`, { amount, category });
      return data.data as Budget;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget", data.id] });
      toast.success("Disbursement recorded");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to record disbursement";
      toast.error(message);
    },
  });
}
