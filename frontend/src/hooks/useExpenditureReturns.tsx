import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type ExpenditureReturn = Tables<'expenditure_returns'>;

export function useExpenditureReturns() {
  return useQuery({
    queryKey: ['expenditure-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenditure_returns')
        .select('*')
        .order('fiscal_year', { ascending: false })
        .order('quarter', { ascending: false });

      if (error) throw error;
      return data as ExpenditureReturn[];
    },
  });
}
