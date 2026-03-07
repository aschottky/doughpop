import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const CONFIGURED = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  supabaseUrl.startsWith('https://')
)

console.log('[DoughFlow] Supabase URL loaded:', supabaseUrl ? supabaseUrl.slice(0, 30) + '...' : 'EMPTY')
console.log('[DoughFlow] Configured:', CONFIGURED)

export const isSupabaseConfigured = () => CONFIGURED

// Only create the real client when we have valid credentials;
// otherwise export a no-op stub so imports never throw.
export const supabase = CONFIGURED
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key-that-is-long-enough-for-validation-purposes-only')
