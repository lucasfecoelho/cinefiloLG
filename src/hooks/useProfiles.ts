import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Profile } from '@/types';

export function useProfiles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
    enabled: !!user,
    staleTime: Infinity, // profiles never change in a 2-person app
  });
}
