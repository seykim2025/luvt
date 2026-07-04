import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HallOfFamePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 명예의 전당 데이터 조회
  const { data: fameList } = await supabase
    .from('hall_of_fame')
    .select(`
      id,
      category,
      note,
      created_at,
      profiles (
        name,
        gender
      ),
      tournaments (
        title,
        event_date
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-20">
      <header className="px-4 py-4 flex items-center border-b border-gray-800">
        <Link href="/" className="text-gray-400 hover:text-white mr-4 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-white tracking-wider flex items-center space-x-2">
          <span>👑</span>
          <span>명예의 전당</span>
        </h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-md w-full mx-auto space-y-6">
        
        <div className="text-center space-y-2 mb-8">
          <p className="text-yellow-500 font-bold tracking-widest text-sm">HALL OF FAME</p>
          <h2 className="text-3xl font-extrabold text-white">LUV.T LEGENDS</h2>
          <p className="text-gray-400 text-sm mt-2">LUV.T 대회를 빛낸 영광의 얼굴들입니다.</p>
        </div>

        {!fameList || fameList.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-3xl border border-gray-700">
            <span className="text-4xl mb-4 block">🏆</span>
            <p className="text-gray-400">아직 등록된 레전드가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fameList.map((fame: any) => {
              const tournamentDate = fame.tournaments?.event_date 
                ? new Date(fame.tournaments.event_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                : ''

              return (
                <div key={fame.id} className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl shadow-xl border border-gray-700 overflow-hidden group hover:border-yellow-500/50 transition-colors">
                  {/* 장식 효과 */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-yellow-500/20 transition-colors"></div>
                  
                  <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                      {fame.category}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-white flex items-center justify-center space-x-2">
                        <span>{fame.profiles?.name}</span>
                        {fame.profiles?.gender && (
                          <span className="text-xs font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
                            {fame.profiles.gender === 'M' ? '남성' : '여성'}
                          </span>
                        )}
                      </h3>
                      {fame.note && (
                        <p className="text-sm text-gray-300 mt-2 font-medium">"{fame.note}"</p>
                      )}
                    </div>
                    
                    {fame.tournaments && (
                      <div className="w-full pt-4 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-400">
                        <span>{fame.tournaments.title}</span>
                        <span>{tournamentDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
