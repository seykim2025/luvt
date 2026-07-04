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

export async function createPartnerPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const message = formData.get('message') as string
  const region = formData.get('region') as string

  if (!message || message.trim() === '') {
    return { ok: false, error: '내용을 입력해주세요.' }
  }

  const { error } = await supabase
    .from('partner_posts')
    .insert({
      user_id: user.id,
      message: message.trim(),
      region: region ? region.trim() : null,
      status: 'open'
    })

  if (error) {
    console.error('Create post error:', error)
    return { ok: false, error: '게시물 작성 중 오류가 발생했습니다.' }
  }

  revalidatePath('/partners')
  return { ok: true }
}

export async function updatePartnerPostStatus(id: string, status: 'open' | 'matched' | 'closed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('partner_posts')
    .update({ status })
    .eq('id', id)
    // RLS will ensure that only the owner or admin can update it

  if (error) {
    console.error('Update post error:', error)
    return { ok: false, error: '상태 변경 중 오류가 발생했습니다.' }
  }

  revalidatePath('/partners')
  return { ok: true }
}

export async function createBenefitRule(formData: FormData) {
  const supabase = await createClient()
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

  const thresholdStr = formData.get('threshold') as string
  const reward = formData.get('reward') as string

  if (!thresholdStr || !reward) {
    return { ok: false, error: '모든 필드를 입력해주세요.' }
  }

  const threshold = parseInt(thresholdStr, 10)

  const { error } = await supabase
    .from('benefit_rules')
    .insert({
      threshold,
      reward,
      active: true
    })

  if (error) {
    console.error('Create rule error:', error)
    if (error.code === '23505') {
      return { ok: false, error: '이미 해당 달성 횟수에 대한 규칙이 존재합니다.' }
    }
    return { ok: false, error: '규칙 생성 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/benefits')
  return { ok: true }
}

export async function redeemBenefit(redemptionId: string) {
  const supabase = await createClient()
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

  const { error } = await supabase
    .from('benefit_redemptions')
    .update({ 
      redeemed_at: new Date().toISOString(),
      redeemed_by: user.id
    })
    .eq('id', redemptionId)
    .is('redeemed_at', null)

  if (error) {
    console.error('Redeem error:', error)
    return { ok: false, error: '사용 처리 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/benefits')
  revalidatePath('/me/benefits')
  return { ok: true }
}
