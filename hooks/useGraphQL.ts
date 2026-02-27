import { useAuth } from '@/context/AuthContext';
import { executeGraphQL } from '@/lib/graphql-client';
import { supabase } from '@/lib/supabase-auth-client';

export function useGraphQL() {
  const { user } = useAuth();

  const query = async <T = any>(query: string, variables?: Record<string, any>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = await executeGraphQL<T>(query, variables, session?.access_token);
      return data;
    } catch (error) {
      console.error('GraphQL Query Error:', error);
      throw error;
    }
  };

  return { query };
} 