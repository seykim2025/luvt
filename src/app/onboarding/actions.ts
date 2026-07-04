'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const gender = formData.get('gender') as string
  const birth_ym = formData.get('birth_ym') as string
  const region = formData.get('region') as string
  const tennis_started_on = formData.get('tennis_started_on') as string
  const dominant_hand = formData.get('dominant_hand') as string

  if (!name || name.trim() === '') {
    return { error: '이름을 입력해주세요.' }
  }
  if (!phone || phone.trim() === '') {
    return { error: '연락처를 입력해주세요.' }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      name: name.trim(),
      phone: phone.trim(),
      gender: gender || null,
      birth_ym: birth_ym || null,
      region: region || null,
      tennis_started_on: tennis_started_on || null,
      dominant_hand: dominant_hand || null,
      role: 'member'
    })

  if (error) {
    console.error('Error creating profile:', error)
    return { error: '프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  redirect('/')
}
