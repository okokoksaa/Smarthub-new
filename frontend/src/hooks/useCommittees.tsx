import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CommitteeType = 'cdfc' | 'tac' | 'wdc' | 'procurement';

export interface Committee {
  id: string;
  name: string;
  committee_type: CommitteeType;
  constituency_id?: string;
  province_id?: string;
  chair_id?: string;
  secretary_id?: string;
  quorum_required: number;
  is_active: boolean;
  created_at: string;
  constituency?: {
    id: string;
    name: string;
    code: string;
  };
  province?: {
    id: string;
    name: string;
  };
  chair?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  secretary?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  members?: CommitteeMember[];
}

export interface CommitteeMember {
  id: string;
  committee_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  left_at?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface Meeting {
  id: string;
  committee_id: string;
  title: string;
  description?: string;
  meeting_date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  agenda?: AgendaItem[];
  minutes?: string;
  minutes_approved: boolean;
  minutes_approved_at?: string;
  quorum_present?: number;
  created_by: string;
  created_at: string;
  committee?: Committee;
  attendees?: MeetingAttendee[];
}

export interface AgendaItem {
  item: string;
  presenter?: string;
  votes?: Vote[];
  conflicts_of_interest?: ConflictOfInterest[];
}

export interface Vote {
  voter_id: string;
  vote: 'approve' | 'reject' | 'abstain';
  comments?: string;
  recorded_at: string;
}

export interface ConflictOfInterest {
  user_id: string;
  description: string;
  will_recuse: boolean;
  declared_at: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  user_id: string;
  attended: boolean;
  attendance_time?: string;
  signature?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

// Fetch all committees via API
export const useCommittees = (filters?: {
  type?: CommitteeType;
  constituencyId?: string;
  provinceId?: string;
}) => {
  return useQuery({
    queryKey: ['committees', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.constituencyId) params.append('constituency_id', filters.constituencyId);
        if (filters?.provinceId) params.append('province_id', filters.provinceId);

        const { data } = await api.get(`/committees?${params.toString()}`);
        return data?.data || data || [];
      } catch (error) {
        // Fallback to direct Supabase
        console.warn('API Gateway unavailable, using Supabase directly');
        let query = supabase
          .from('committees')
          .select(`
            *,
            constituency:constituencies(id, name, code),
            province:provinces(id, name)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (filters?.type) query = query.eq('committee_type', filters.type);
        if (filters?.constituencyId) query = query.eq('constituency_id', filters.constituencyId);
        if (filters?.provinceId) query = query.eq('province_id', filters.provinceId);

        const { data, error: dbError } = await query;
        if (dbError) throw dbError;
        return data as Committee[];
      }
    },
  });
};

// Fetch single committee
export const useCommittee = (committeeId?: string) => {
  return useQuery({
    queryKey: ['committee', committeeId],
    queryFn: async () => {
      if (!committeeId) return null;
      const { data } = await api.get(`/committees/${committeeId}`);
      return data;
    },
    enabled: !!committeeId,
  });
};

// Create committee via API
export const useCreateCommittee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      committee_type: CommitteeType;
      constituency_id?: string;
      province_id?: string;
      chair_id?: string;
      secretary_id?: string;
      quorum_required: number;
    }) => {
      const { data: result } = await api.post('/committees', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees'] });
      toast.success('Committee created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to create committee', { description: message });
    },
  });
};

// Add member to committee
export const useAddMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ committeeId, userId, role }: {
      committeeId: string;
      userId: string;
      role: string;
    }) => {
      const { data } = await api.post(`/committees/${committeeId}/members`, {
        user_id: userId,
        role,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['committee', variables.committeeId] });
      queryClient.invalidateQueries({ queryKey: ['committees'] });
      toast.success('Member added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to add member', { description: message });
    },
  });
};

// Remove member from committee
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ committeeId, userId }: { committeeId: string; userId: string }) => {
      const { data } = await api.delete(`/committees/${committeeId}/members/${userId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['committee', variables.committeeId] });
      queryClient.invalidateQueries({ queryKey: ['committees'] });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to remove member', { description: message });
    },
  });
};

// Fetch all meetings
export const useMeetings = (filters?: {
  committeeId?: string;
  status?: Meeting['status'];
  fromDate?: string;
  toDate?: string;
}) => {
  return useQuery({
    queryKey: ['meetings', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.committeeId) params.append('committee_id', filters.committeeId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.fromDate) params.append('from_date', filters.fromDate);
        if (filters?.toDate) params.append('to_date', filters.toDate);

        const { data } = await api.get(`/meetings?${params.toString()}`);
        return data?.data || data || [];
      } catch (error) {
        // Fallback to direct Supabase
        let query = supabase
          .from('meetings')
          .select(`
            *,
            committee:committees(id, name, committee_type)
          `)
          .order('meeting_date', { ascending: false });

        if (filters?.committeeId) query = query.eq('committee_id', filters.committeeId);
        if (filters?.status) query = query.eq('status', filters.status);

        const { data, error: dbError } = await query;
        if (dbError) throw dbError;
        return data as Meeting[];
      }
    },
  });
};

// Fetch single meeting
export const useMeeting = (meetingId?: string) => {
  return useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: async () => {
      if (!meetingId) return null;
      const { data } = await api.get(`/meetings/${meetingId}`);
      return data;
    },
    enabled: !!meetingId,
  });
};

// Schedule a meeting
export const useCreateMeeting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      committee_id: string;
      title: string;
      description?: string;
      meeting_date: string;
      start_time?: string;
      end_time?: string;
      venue?: string;
      agenda?: { item: string; presenter?: string }[];
    }) => {
      const { data: result } = await api.post('/meetings', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting scheduled successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to schedule meeting', { description: message });
    },
  });
};

// Record attendance
export const useRecordAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetingId, userId, attended, signature }: {
      meetingId: string;
      userId: string;
      attended: boolean;
      signature?: string;
    }) => {
      const { data } = await api.post(`/meetings/${meetingId}/attendance`, {
        user_id: userId,
        attended,
        signature,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.meetingId] });
      toast.success('Attendance recorded');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to record attendance', { description: message });
    },
  });
};

// Declare conflict of interest
export const useDeclareConflict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetingId, userId, agendaItem, description, willRecuse }: {
      meetingId: string;
      userId: string;
      agendaItem: string;
      description: string;
      willRecuse: boolean;
    }) => {
      const { data } = await api.post(`/meetings/${meetingId}/conflict-of-interest`, {
        user_id: userId,
        agenda_item: agendaItem,
        conflict_description: description,
        will_recuse: willRecuse,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.meetingId] });
      toast.success('Conflict of interest declared');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to declare conflict', { description: message });
    },
  });
};

// Record vote (with quorum enforcement)
export const useRecordVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetingId, voterId, agendaItem, vote, comments }: {
      meetingId: string;
      voterId: string;
      agendaItem: string;
      vote: 'approve' | 'reject' | 'abstain';
      comments?: string;
    }) => {
      const { data } = await api.post(`/meetings/${meetingId}/vote`, {
        voter_id: voterId,
        agenda_item: agendaItem,
        vote,
        comments,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.meetingId] });
      toast.success('Vote recorded');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to record vote', { description: message });
    },
  });
};

// Upload minutes
export const useUploadMinutes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetingId, minutes, documentUrl }: {
      meetingId: string;
      minutes: string;
      documentUrl?: string;
    }) => {
      const { data } = await api.post(`/meetings/${meetingId}/minutes`, {
        minutes,
        document_url: documentUrl,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.meetingId] });
      toast.success('Minutes uploaded');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to upload minutes', { description: message });
    },
  });
};

// Approve minutes
export const useApproveMinutes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ meetingId, comments }: { meetingId: string; comments?: string }) => {
      const { data } = await api.post(`/meetings/${meetingId}/approve-minutes`, { comments });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.meetingId] });
      toast.success('Minutes approved');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to approve minutes', { description: message });
    },
  });
};
