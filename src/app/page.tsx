import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm mx-auto space-y-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <header className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            LUV.T OPEN
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            환영합니다, {profile.name}님!
          </p>
        </header>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">내 프로필 정보 (M1 확인용)</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><span className="font-medium text-gray-900">이름:</span> {profile.name}</li>
              <li><span className="font-medium text-gray-900">연락처:</span> {profile.phone || '없음'}</li>
              <li><span className="font-medium text-gray-900">NTRP:</span> {profile.ntrp || '없음'}</li>
              <li><span className="font-medium text-gray-900">권한:</span> {profile.role}</li>
            </ul>
          </div>
          
          <form action="/auth/signout" method="POST">
            <button className="w-full text-sm text-gray-500 hover:text-gray-900 underline py-2">
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
