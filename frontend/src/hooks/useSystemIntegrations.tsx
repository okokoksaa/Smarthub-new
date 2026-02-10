import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type SystemIntegration = Tables<'system_integrations'>;

export function useSystemIntegrations() {
  return useQuery({
    queryKey: ['system-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_integrations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as SystemIntegration[];
    },
  });
}
