import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ParticipateButton from './components/ParticipateButton'

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

  // 1. 오늘 날짜의 진행중/오픈 대회 확인
  const { data: todayTournament } = await supabase
    .from('tournaments')
    .select('id, title, status')
    .eq('event_date', new Date().toISOString().split('T')[0])
    .in('status', ['open', 'ongoing'])
    .single()

  // 2. 사용자의 오늘 대회 참가 여부 확인
  let participationStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none'
  if (todayTournament) {
    const { data: participation } = await supabase
      .from('participations')
      .select('status')
      .eq('tournament_id', todayTournament.id)
      .eq('user_id', user.id)
      .single()
      
    if (participation) {
      participationStatus = participation.status as any
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-4 flex justify-between items-center shadow-sm">
        <Image
          src="/logo.jpg"
          alt="LUV.T Logo"
          width={40}
          height={40}
          priority
          className="rounded-full"
        />
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
          LUV.T
        </h1>
        <form action="/auth/signout" method="POST">
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900">
            로그아웃
          </button>
        </form>
      </header>

      <main className="flex-1 px-4 py-8 max-w-md w-full mx-auto space-y-8">
        <section className="text-center space-y-2">
          <p className="text-gray-500 font-medium">환영합니다!</p>
          <h2 className="text-3xl font-bold text-gray-900">{profile.name}님</h2>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center space-y-6">
          <div className="w-full text-center">
            {todayTournament ? (
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{todayTournament.title}</h3>
            ) : (
              <h3 className="text-lg font-medium text-gray-500 mb-1">오늘 진행되는 대회가 없습니다</h3>
            )}
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
          </div>

          <ParticipateButton 
            status={participationStatus} 
            disabledReason={!todayTournament ? '오늘 대회 없음' : undefined}
          />
        </section>

        <nav className="grid grid-cols-2 gap-4">
          <Link href="/me/records" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 active:scale-95 transition-all">
            <span className="text-2xl">🏆</span>
            <span className="text-sm font-semibold text-gray-800">내 참가 기록</span>
          </Link>
          <Link href="/me/benefits" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 active:scale-95 transition-all">
            <span className="text-2xl">🎁</span>
            <span className="text-sm font-semibold text-gray-800">내 혜택</span>
          </Link>
          <Link href="/hall-of-fame" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 active:scale-95 transition-all">
            <span className="text-2xl">👑</span>
            <span className="text-sm font-semibold text-gray-800">명예의 전당</span>
          </Link>
          <Link href="/partners" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 active:scale-95 transition-all">
            <span className="text-2xl">🤝</span>
            <span className="text-sm font-semibold text-gray-800">파트너 찾기</span>
          </Link>
          <Link href="/me" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 active:scale-95 transition-all col-span-2">
            <span className="text-2xl">👤</span>
            <span className="text-sm font-semibold text-gray-800">내 프로필</span>
          </Link>
        </nav>
      </main>
    </div>
  )
}
