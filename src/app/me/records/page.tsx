import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RecordsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. 역대 참가 이력 조회 (pending, approved, rejected)
  const { data: participations } = await supabase
    .from('participations')
    .select(`
      id,
      status,
      checked_in_at,
      tournaments (
        id,
        title,
        event_date
      )
    `)
    .eq('user_id', user.id)
    .order('checked_in_at', { ascending: false })

  const approvedCount = participations?.filter(p => p.status === 'approved').length || 0

  // 2. 스탬프판 UI 데이터 (10칸)
  const totalStamps = 10
  const stamps = Array.from({ length: totalStamps }).map((_, i) => {
    const threshold = i + 1
    const isStamped = approvedCount >= threshold
    // 혜택 구간 예시 (3, 5, 10회)
    const isBenefit = [3, 5, 10].includes(threshold)
    
    return {
      threshold,
      isStamped,
      isBenefit
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-4 flex items-center shadow-sm border-b border-gray-100">
        <Link href="/" className="text-gray-500 hover:text-gray-900 mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">내 참가 기록</h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-md w-full mx-auto space-y-8">
        
        {/* 스탬프판 */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">내 스탬프 보드</h2>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              총 {approvedCount}회 달성!
            </span>
          </div>
          
          <div className="grid grid-cols-5 gap-3 mt-4">
            {stamps.map((stamp, i) => (
              <div 
                key={i} 
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                  stamp.isStamped 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : stamp.isBenefit 
                      ? 'bg-orange-50 border-2 border-dashed border-orange-200 text-orange-400' 
                      : 'bg-gray-50 border border-gray-200 text-gray-300'
                }`}
              >
                {stamp.isStamped ? (
                  <span className="text-2xl">🎾</span>
                ) : stamp.isBenefit ? (
                  <span className="text-xl">🎁</span>
                ) : (
                  <span className="text-lg font-bold">{stamp.threshold}</span>
                )}
                {stamp.isBenefit && !stamp.isStamped && (
                  <span className="absolute -bottom-2 text-[10px] font-bold text-orange-500 bg-orange-100 px-1.5 rounded-sm">혜택</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 참가 이력 리스트 */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 px-1">참가 이력</h2>
          
          {!participations || participations.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">아직 참가한 대회가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participations.map((p: any) => {
                const tournamentDate = new Date(p.tournaments.event_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                let statusBadge = ''
                
                if (p.status === 'approved') {
                  statusBadge = '<span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">승인됨</span>'
                } else if (p.status === 'pending') {
                  statusBadge = '<span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">대기중</span>'
                } else if (p.status === 'rejected') {
                  statusBadge = '<span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">거절됨</span>'
                }

                return (
                  <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{tournamentDate}</p>
                      <h3 className="font-semibold text-gray-900">{p.tournaments.title}</h3>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: statusBadge }} />
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
