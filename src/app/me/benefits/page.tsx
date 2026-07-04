import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function BenefitsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 사용자의 혜택 목록 조회
  const { data: redemptions } = await supabase
    .from('benefit_redemptions')
    .select(`
      id,
      earned_at,
      expires_at,
      redeemed_at,
      benefit_rules (
        threshold,
        reward,
        discount_amount
      )
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-4 flex items-center shadow-sm border-b border-gray-100">
        <Link href="/" className="text-gray-500 hover:text-gray-900 mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">내 혜택</h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-md w-full mx-auto space-y-6">
        
        {!redemptions || redemptions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
            <span className="text-4xl mb-4 block">🎁</span>
            <p className="text-gray-500 font-medium">아직 받은 혜택이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">대회에 더 참가하고 혜택을 받아보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption: any) => {
              const rule = redemption.benefit_rules
              const isRedeemed = !!redemption.redeemed_at
              const isExpired = !isRedeemed && redemption.expires_at && new Date(redemption.expires_at) < new Date()
              
              let statusText = '사용 가능'
              let statusColor = 'bg-blue-600 text-white'
              let cardOpacity = ''

              if (isRedeemed) {
                statusText = '사용 완료'
                statusColor = 'bg-gray-200 text-gray-500'
                cardOpacity = 'opacity-60 grayscale'
              } else if (isExpired) {
                statusText = '기간 만료'
                statusColor = 'bg-red-100 text-red-600'
                cardOpacity = 'opacity-60'
              }

              return (
                <div key={redemption.id} className={`bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden ${cardOpacity}`}>
                  <div className="border-b border-dashed border-gray-200 p-5 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white">
                    <div>
                      <span className="text-xs font-bold text-orange-600 tracking-wide">
                        {rule?.threshold}회 참가 달성 보상
                      </span>
                      <h3 className="text-xl font-extrabold text-gray-900 mt-1">{rule?.reward}</h3>
                    </div>
                    <span className="text-3xl">🎁</span>
                  </div>
                  
                  <div className="p-5 bg-white flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        발급일: {new Date(redemption.earned_at).toLocaleDateString('ko-KR')}
                      </p>
                      {redemption.expires_at && (
                        <p className="text-xs text-red-400 font-medium">
                          만료일: {new Date(redemption.expires_at).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                    
                    <div className={`px-4 py-2 rounded-xl font-bold text-sm ${statusColor}`}>
                      {statusText}
                    </div>
                  </div>

                  {!isRedeemed && !isExpired && (
                    <div className="bg-gray-900 text-white text-center py-3 text-xs font-medium tracking-wide">
                      이 화면을 현장 스태프에게 보여주세요
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
