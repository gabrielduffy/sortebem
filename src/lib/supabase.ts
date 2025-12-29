import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ctjdbnvcqcyitpydnmdt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0amRibnZjcWN5aXRweWRubWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MjIwNDAsImV4cCI6MjA1MTA5ODA0MH0.sb_publishable_nWF8u-_Cm-62nY1QoyzRgg_ISni9Dkg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
