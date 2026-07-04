import { createClient } from '@/utils/supabase/server'
import CreateTournamentForm from './CreateTournamentForm'

export default async function TournamentsPage() {
  const supabase = await createClient()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('event_date', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">대회 관리</h1>
        <p className="text-gray-500">새로운 대회를 개설하고 기존 대회를 확인합니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 개설 폼 */}
        <div>
          <CreateTournamentForm />
        </div>

        {/* 목록 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">대회 목록</h2>
          
          {(!tournaments || tournaments.length === 0) ? (
            <p className="text-gray-500 text-sm">등록된 대회가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {tournaments.map((t: any) => {
                let statusColor = 'bg-gray-100 text-gray-600'
                if (t.status === 'open') statusColor = 'bg-blue-100 text-blue-700'
                else if (t.status === 'ongoing') statusColor = 'bg-green-100 text-green-700'
                else if (t.status === 'draft') statusColor = 'bg-yellow-100 text-yellow-700'

                return (
                  <div key={t.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{t.event_date}</p>
                      <h3 className="font-semibold text-gray-900">{t.title}</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusColor}`}>
                      {t.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
