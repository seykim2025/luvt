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
  const ntrp = formData.get('ntrp') as string

  if (!name || name.trim() === '') {
    return { error: '이름을 입력해주세요.' }
  }

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      ntrp: ntrp ? ntrp.trim() : null,
      role: 'member'
    })

  if (error) {
    console.error('Error creating profile:', error)
    return { error: '프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  redirect('/')
}
