import { supabase } from '../lib/supabase'
import type { DashboardStats } from '../types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats')
  if (error) throw error
  return data as DashboardStats
}
