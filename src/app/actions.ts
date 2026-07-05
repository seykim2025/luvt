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

export async function createInquiry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const category = formData.get('category') as string
  const content = formData.get('content') as string

  if (!content || content.trim() === '') {
    return { ok: false, error: '내용을 입력해주세요.' }
  }

  const { error } = await supabase
    .from('inquiries')
    .insert({
      user_id: user.id,
      category: category === 'report' ? 'report' : 'general',
      content: content.trim()
    })

  if (error) {
    console.error('Create inquiry error:', error)
    return { ok: false, error: '문의 등록 중 오류가 발생했습니다.' }
  }

  revalidatePath('/inquiry')
  return { ok: true }
}

export async function replyInquiry(formData: FormData) {
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

  const id = formData.get('id') as string
  const reply = formData.get('reply') as string

  if (!id || !reply || reply.trim() === '') {
    return { ok: false, error: '답변 내용을 입력해주세요.' }
  }

  const { error } = await supabase
    .from('inquiries')
    .update({
      reply: reply.trim(),
      replied_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Reply inquiry error:', error)
    return { ok: false, error: '답변 등록 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/boards')
  return { ok: true }
}

export async function createNotice(formData: FormData) {
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

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const target = formData.get('target') as 'all' | 'selected'
  const targetUserIdsStr = formData.get('targetUserIds') as string

  if (!title || !content) {
    return { ok: false, error: '제목과 내용을 입력해주세요.' }
  }

  let target_user_ids: string[] | null = null
  if (target === 'selected') {
    if (!targetUserIdsStr) return { ok: false, error: '선택된 유저가 없습니다.' }
    target_user_ids = targetUserIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0)
  }

  const { error } = await supabase
    .from('notices')
    .insert({
      title: title.trim(),
      content: content.trim(),
      target,
      target_user_ids,
      created_by: user.id
    })

  if (error) {
    console.error('Create notice error:', error)
    return { ok: false, error: '공지 등록 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/notices')
  revalidatePath('/notices')
  return { ok: true }
}

export async function updateFinalResult(participationId: string, finalResult: string) {
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
    .from('participations')
    .update({ final_result: finalResult || null })
    .eq('id', participationId)

  if (error) {
    console.error('Update result error:', error)
    return { ok: false, error: '성적 업데이트 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/results')
  return { ok: true }
}
