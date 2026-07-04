'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function participateToday() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' }
  }

  // Call the check_in_today RPC defined in the database
  const { data, error } = await supabase.rpc('check_in_today')
  
  if (error) {
    console.error('Participation error:', error)
    return { ok: false, error: '참가 접수 중 오류가 발생했습니다.' }
  }

  // Revalidate the home page to reflect the new state
  revalidatePath('/')
  
  return data
}
