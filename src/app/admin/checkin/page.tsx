import { createClient } from '@/utils/supabase/server'
import CheckinForm from './CheckinForm'

export default async function CheckinPage() {
  const supabase = await createClient()

  // 1. 오늘 열린 대회 찾기 (KST 기준)
  const kstDate = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: todayTournament } = await supabase
    .from('tournaments')
    .select('id, title, status')
    .eq('event_date', kstDate)
    .in('status', ['open', 'ongoing'])
    .single()

  let participations: any[] = []
  
  // 2. 대회가 있다면 대기 중인 참가자 목록 조회
  if (todayTournament) {
    const { data } = await supabase
      .from('participations')
      .select(`
        id,
        profiles (
          name,
          gender,
          phone
        )
      `)
      .eq('tournament_id', todayTournament.id)
      .eq('status', 'pending')
      .order('checked_in_at', { ascending: true })
      
    if (data) participations = data
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">오늘의 출석부</h1>
        <p className="text-gray-500">참가 신청을 한 회원들을 확인하고 일괄 승인합니다.</p>
      </div>

      {!todayTournament ? (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">오늘 진행 중인 대회가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-black text-white p-4 rounded-xl">
            <p className="text-sm text-gray-300 mb-1">진행 중인 대회</p>
            <h2 className="text-xl font-bold">{todayTournament.title}</h2>
          </div>
          
          <CheckinForm participations={participations} />
        </div>
      )}
    </div>
  )
}
