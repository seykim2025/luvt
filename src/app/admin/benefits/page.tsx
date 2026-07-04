import { createClient } from '@/utils/supabase/server'
import CreateRuleForm from './CreateRuleForm'
import { redeemBenefit } from '@/app/actions'

export default async function AdminBenefitsPage() {
  const supabase = await createClient()

  // 1. 규칙 조회
  const { data: rules } = await supabase
    .from('benefit_rules')
    .select('*')
    .order('threshold', { ascending: true })

  // 2. 미사용 혜택 조회 (사용 가능 상태만)
  const { data: pendingRedemptions } = await supabase
    .from('benefit_redemptions')
    .select(`
      id,
      earned_at,
      benefit_rules (
        threshold,
        reward
      ),
      profiles (
        name,
        phone
      )
    `)
    .is('redeemed_at', null)
    .order('earned_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">혜택 및 쿠폰 관리</h1>
        <p className="text-gray-500">참가 횟수에 따른 혜택 규칙을 설정하고, 현장에서 사용 요청된 쿠폰을 처리합니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 규칙 설정 영역 */}
        <div className="space-y-6">
          <CreateRuleForm />
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">현재 적용된 규칙</h2>
            {!rules || rules.length === 0 ? (
              <p className="text-gray-500 text-sm">설정된 규칙이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {rules.map((rule: any) => (
                  <div key={rule.id} className="p-4 rounded-xl border border-blue-100 bg-blue-50 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-blue-600 mb-1 block">
                        {rule.threshold}회 참가 시
                      </span>
                      <h3 className="font-semibold text-gray-900">{rule.reward}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 미사용 쿠폰 영역 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">사용 요청된 혜택(쿠폰)</h2>
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">
              대기중 {pendingRedemptions?.length || 0}건
            </span>
          </div>

          {!pendingRedemptions || pendingRedemptions.length === 0 ? (
            <p className="text-gray-500 text-sm py-10 text-center">현재 대기 중인 쿠폰이 없습니다.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {pendingRedemptions.map((r: any) => (
                <div key={r.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{r.profiles?.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{r.profiles?.phone || '연락처 없음'}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.earned_at).toLocaleDateString('ko-KR')} 발급
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <div>
                      <span className="text-xs text-orange-600 font-bold">{r.benefit_rules?.threshold}회 달성 보상</span>
                      <p className="font-semibold text-gray-800">{r.benefit_rules?.reward}</p>
                    </div>
                    
                    <form action={async () => {
                      'use server'
                      await redeemBenefit(r.id)
                    }}>
                      <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
                        사용 완료 처리
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
