import { supabase } from '../lib/supabase';

export interface SupabaseCheckResult {
  isConfigured: boolean;
  urlValid: boolean;
  keyValid: boolean;
  connectionWorking: boolean;
  authWorking: boolean;
  tablesAccessible: boolean;
  errors: string[];
  details: {
    url?: string;
    keyPrefix?: string;
    version?: string;
  };
}

export async function checkSupabaseConfiguration(): Promise<SupabaseCheckResult> {
  const result: SupabaseCheckResult = {
    isConfigured: false,
    urlValid: false,
    keyValid: false,
    connectionWorking: false,
    authWorking: false,
    tablesAccessible: false,
    errors: [],
    details: {}
  };

  try {
    // Check environment variables
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      result.errors.push('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
      return result;
    }

    result.details.url = url;
    result.details.keyPrefix = key.substring(0, 20) + '...';

    // Validate URL format
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('supabase')) {
        result.errors.push('URL does not appear to be a valid Supabase URL');
      } else {
        result.urlValid = true;
      }
    } catch {
      result.errors.push('Invalid URL format');
    }

    // Validate key format (should start with 'eyJ')
    if (key.startsWith('eyJ')) {
      result.keyValid = true;
    } else {
      result.errors.push('Anon key does not appear to be in correct JWT format');
    }

    if (result.urlValid && result.keyValid) {
      result.isConfigured = true;

      // Test basic connection
      try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        
        if (error) {
          if (error.code === 'PGRST116') {
            result.errors.push('Table "users" does not exist - database migration may not have run');
          } else if (error.code === '42501') {
            result.errors.push('Permission denied - RLS policies may not be configured correctly');
          } else {
            result.errors.push(`Database error: ${error.message}`);
          }
        } else {
          result.connectionWorking = true;
          result.tablesAccessible = true;
        }
      } catch (error) {
        result.errors.push(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test auth functionality
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          result.errors.push(`Auth error: ${sessionError.message}`);
        } else {
          result.authWorking = true;
          if (session) {
            result.details.version = 'Authenticated session found';
          }
        }
      } catch (error) {
        result.errors.push(`Auth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

  } catch (error) {
    result.errors.push(`Configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}