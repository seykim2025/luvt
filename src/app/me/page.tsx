import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function MyProfilePage() {
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

  // 참가 횟수 및 정보 조회
  const { count: participationCount } = await supabase
    .from('participations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved')

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-4 flex items-center justify-between shadow-sm border-b border-gray-100">
        <div className="flex items-center">
          <Link href="/" className="text-gray-500 hover:text-gray-900 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">내 프로필</h1>
        </div>
        {profile.role === 'admin' && (
          <Link href="/admin" className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            관리자 모드
          </Link>
        )}
      </header>

      <main className="flex-1 px-4 py-8 max-w-md w-full mx-auto space-y-6">
        
        {/* 프로필 카드 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl overflow-hidden relative">
            {profile.gender === 'M' ? '👨' : profile.gender === 'F' ? '👩' : '👤'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{profile.phone || '연락처 없음'}</p>
            <div className="mt-3 inline-flex items-center space-x-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
              <span>🏆</span>
              <span>누적 참가 {participationCount || 0}회</span>
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between">
            <span className="text-gray-500 text-sm">출생연월</span>
            <span className="font-medium text-gray-900">{profile.birth_ym || '-'}</span>
          </div>
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between">
            <span className="text-gray-500 text-sm">주 활동 지역</span>
            <span className="font-medium text-gray-900">{profile.region || '-'}</span>
          </div>
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between">
            <span className="text-gray-500 text-sm">주 사용 손</span>
            <span className="font-medium text-gray-900">{profile.dominant_hand === 'R' ? '오른손' : profile.dominant_hand === 'L' ? '왼손' : '-'}</span>
          </div>
        </div>

        {/* 메뉴 리스트 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <Link href="/me/records" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏆</span>
              <span className="font-medium text-gray-800">내 참가 기록</span>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
          <Link href="/me/benefits" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🎁</span>
              <span className="font-medium text-gray-800">내 혜택 (쿠폰함)</span>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
          <Link href="/inquiry" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">💬</span>
              <span className="font-medium text-gray-800">1:1 문의 / 제보</span>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        </div>

        {/* 하단 버튼 */}
        <div className="pt-4">
          <form action="/auth/signout" method="POST">
            <button className="w-full py-4 text-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              로그아웃
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
