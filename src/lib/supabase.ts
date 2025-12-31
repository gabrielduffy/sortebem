import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ctjdbnvcqcyitpydnmdt.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0amRibnZjcWN5aXRweWRubWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjc5NDgsImV4cCI6MjA4MjYwMzk0OH0.-uOSbHoV3HxMZ3WXdIIfH7PF_WwKagqSANPwzijlBnU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
