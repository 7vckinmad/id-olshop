import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mydogujaqdhqhsmvfwkn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pwsJwXJzOnlfTL17U8mlfQ_HJhy5hK5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
