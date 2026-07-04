'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTournament(formData: FormData) {
  const supabase = await createClient()

  // 1. Admin 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { ok: false, error: '관리자 권한이 없습니다.' }
  }

  // 2. 입력값 추출
  const title = formData.get('title') as string
  const event_date = formData.get('event_date') as string
  const status = formData.get('status') as string || 'open'

  if (!title || !event_date) {
    return { ok: false, error: '대회 이름과 날짜를 모두 입력해주세요.' }
  }

  // 3. 데이터 삽입
  const { error } = await supabase
    .from('tournaments')
    .insert({
      title,
      event_date,
      status
    })

  if (error) {
    console.error('Create tournament error:', error)
    if (error.code === '23505') {
      return { ok: false, error: '해당 날짜에 이미 등록된 대회가 있습니다.' }
    }
    return { ok: false, error: '대회 개설 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/tournaments')
  revalidatePath('/admin')
  revalidatePath('/') // 앱 홈 화면의 상태도 바뀔 수 있으므로 갱신
  
  return { ok: true }
}

export async function bulkApprove(participationIds: string[]) {
  const supabase = await createClient()

  // 1. Admin 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { ok: false, error: '관리자 권한이 없습니다.' }
  }

  if (!participationIds || participationIds.length === 0) {
    return { ok: false, error: '승인할 참가자를 선택해주세요.' }
  }

  // 2. RPC 호출 (일괄 승인 및 혜택 발급)
  const { data, error } = await supabase.rpc('approve_participations', {
    p_ids: participationIds
  })

  if (error) {
    console.error('Bulk approve error:', error)
    return { ok: false, error: '승인 처리 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/checkin')
  revalidatePath('/admin')
  
  return { ok: true, data }
}
