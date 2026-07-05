import { createClient } from '@/utils/supabase/server'
import { updateFinalResult } from '@/app/actions'

export default async function AdminResultsPage({
  searchParams
}: {
  searchParams: { tournament_id?: string }
}) {
  const supabase = await createClient()

  // 완료되거나 진행중인 대회 목록 가져오기
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, title, event_date, status')
    .in('status', ['ongoing', 'done'])
    .order('event_date', { ascending: false })

  const selectedTournamentId = searchParams.tournament_id || tournaments?.[0]?.id

  // 선택된 대회의 승인된 참가자 목록 가져오기
  let participations: any[] = []
  if (selectedTournamentId) {
    const { data } = await supabase
      .from('participations')
      .select(`
        id,
        status,
        final_result,
        profiles (name, phone)
      `)
      .eq('tournament_id', selectedTournamentId)
      .eq('status', 'approved')
      .order('checked_in_at', { ascending: true })
    
    participations = data || []
  }

  const resultOptions = [
    { value: '', label: '결과 없음 (미입력)' },
    { value: '우승', label: '🏆 우승' },
    { value: '준우승', label: '🥈 준우승' },
    { value: '4강', label: '🥉 4강' },
    { value: '8강', label: '🎾 8강' },
    { value: '본선', label: '본선 진출' },
    { value: '예선탈락', label: '예선 탈락' }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">경기 결과 관리</h1>
        <p className="text-gray-500">대회가 종료된 후, 참가자들의 최종 성적을 기록합니다.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <form method="GET" className="mb-8">
          <label htmlFor="tournament_id" className="block text-sm font-bold text-gray-700 mb-2">대회 선택</label>
          <div className="flex space-x-2">
            <select
              id="tournament_id"
              name="tournament_id"
              defaultValue={selectedTournamentId}
              className="flex-1 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
              onChange={(e) => e.target.form?.submit()}
            >
              {tournaments?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.event_date}) - {t.status === 'done' ? '종료됨' : '진행중'}
                </option>
              ))}
              {!tournaments?.length && <option value="">종료된 대회가 없습니다.</option>}
            </select>
          </div>
        </form>

        {selectedTournamentId && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">참가자 명단 및 성적 입력</h2>
              <span className="text-sm text-gray-500">총 {participations.length}명</span>
            </div>

            {participations.length === 0 ? (
              <p className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl">승인된 참가자가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름 (연락처)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재 성적</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성적 변경</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participations.map((p) => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{p.profiles?.name}</div>
                          <div className="text-sm text-gray-500">{p.profiles?.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {p.final_result ? (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800">
                              {p.final_result}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">미입력</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <form action={async (formData) => {
                            'use server'
                            await updateFinalResult(p.id, formData.get('final_result') as string)
                          }} className="flex items-center space-x-2">
                            <select 
                              name="final_result" 
                              defaultValue={p.final_result || ''}
                              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1 pl-2 pr-8 border"
                            >
                              {resultOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <button type="submit" className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-700">
                              저장
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
