import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a dummy client if environment variables are missing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Database types
export interface DatabasePhoto {
  id: string
  url: string
  name: string
  size: number
  added_at: string
  deleted_at?: string
  status: 'active' | 'deleted' | 'permanently-deleted'
  source: 'upload' | 'camera'
  user_id?: string
  created_at: string
  updated_at: string
}

export interface PhotoUpload {
  file: File
  name: string
  size: number
  source: 'upload' | 'camera'
} 