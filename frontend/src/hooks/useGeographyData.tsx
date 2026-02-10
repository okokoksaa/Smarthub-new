import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Province {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  name: string;
  code: string;
  province_id: string;
  province?: Province;
}

export interface Constituency {
  id: string;
  name: string;
  code: string;
  district_id: string;
  district?: District;
  total_budget?: number;
  allocated_budget?: number;
  disbursed_budget?: number;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  constituency_id: string;
  constituency?: Constituency;
}

export interface GeographyStatistics {
  provinces: number;
  districts: number;
  constituencies: number;
  wards: number;
}

// ==================== PROVINCES ====================

export const useProvinces = () => {
  return useQuery({
    queryKey: ['geography', 'provinces'],
    queryFn: async () => {
      const { data } = await api.get('/geography/provinces');
      return data.data as Province[];
    },
  });
};

export const useProvince = (id?: string) => {
  return useQuery({
    queryKey: ['geography', 'provinces', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/geography/provinces/${id}`);
      return data.data as Province;
    },
    enabled: !!id,
  });
};

// ==================== DISTRICTS ====================

export const useDistricts = (provinceId?: string) => {
  return useQuery({
    queryKey: ['geography', 'districts', provinceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (provinceId) params.append('province_id', provinceId);

      const { data } = await api.get(`/geography/districts?${params.toString()}`);
      return data.data as District[];
    },
  });
};

export const useDistrict = (id?: string) => {
  return useQuery({
    queryKey: ['geography', 'districts', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/geography/districts/${id}`);
      return data.data as District;
    },
    enabled: !!id,
  });
};

// ==================== CONSTITUENCIES ====================

export const useConstituencies = (districtId?: string) => {
  return useQuery({
    queryKey: ['geography', 'constituencies', districtId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (districtId) params.append('district_id', districtId);

      const { data } = await api.get(`/geography/constituencies?${params.toString()}`);
      return data.data as Constituency[];
    },
  });
};

export const useConstituency = (id?: string) => {
  return useQuery({
    queryKey: ['geography', 'constituencies', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/geography/constituencies/${id}`);
      return data.data as Constituency;
    },
    enabled: !!id,
  });
};

// ==================== WARDS ====================

export const useWards = (constituencyId?: string) => {
  return useQuery({
    queryKey: ['geography', 'wards', constituencyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (constituencyId) params.append('constituency_id', constituencyId);

      const { data } = await api.get(`/geography/wards?${params.toString()}`);
      return data.data as Ward[];
    },
  });
};

export const useWard = (id?: string) => {
  return useQuery({
    queryKey: ['geography', 'wards', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/geography/wards/${id}`);
      return data.data as Ward;
    },
    enabled: !!id,
  });
};

// ==================== UTILITIES ====================

export const useGeographyHierarchy = () => {
  return useQuery({
    queryKey: ['geography', 'hierarchy'],
    queryFn: async () => {
      const { data } = await api.get('/geography/hierarchy');
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - hierarchy data rarely changes
  });
};

export const useGeographyStatistics = () => {
  return useQuery({
    queryKey: ['geography', 'statistics'],
    queryFn: async () => {
      const { data } = await api.get('/geography/statistics');
      return data.data as GeographyStatistics;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
