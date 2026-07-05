import { createClient } from '@/utils/supabase/server'
import { replyInquiry } from '@/app/actions'

export default async function AdminBoardsPage() {
  const supabase = await createClient()

  // 문의 내역 조회 (최신순)
  const { data: inquiries } = await supabase
    .from('inquiries')
    .select(`
      *,
      profiles (
        name,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">게시판 (1:1 문의 / 제보) 관리</h1>
        <p className="text-gray-500">사용자들이 남긴 문의사항과 악성 유저 제보를 확인하고 답변을 등록합니다.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">전체 문의 내역</h2>
          <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
            총 {inquiries?.length || 0}건
          </span>
        </div>

        {!inquiries || inquiries.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl mb-4 block">📝</span>
            <p className="text-gray-500">등록된 문의 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {inquiries.map((inq: any) => (
              <div key={inq.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${inq.category === 'report' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {inq.category === 'report' ? '제보' : '일반 문의'}
                      </span>
                      {inq.reply ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">답변 완료</span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700">미답변</span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900">{inq.profiles?.name} <span className="text-gray-400 font-normal text-sm ml-1">({inq.profiles?.phone || '연락처 없음'})</span></p>
                  </div>
                  <span className="text-sm text-gray-400">{new Date(inq.created_at).toLocaleString('ko-KR')}</span>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap mb-4">
                  {inq.content}
                </div>

                {inq.reply ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 pl-10 relative">
                    <span className="absolute left-4 top-4 text-blue-400">↳</span>
                    <p className="text-xs text-blue-400 mb-1">{new Date(inq.replied_at).toLocaleString('ko-KR')} 답변됨</p>
                    <p className="text-sm text-blue-900 whitespace-pre-wrap">{inq.reply}</p>
                  </div>
                ) : (
                  <form action={async (formData) => {
                    'use server'
                    await replyInquiry(formData)
                  }} className="mt-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <input type="hidden" name="id" value={inq.id} />
                    <textarea 
                      name="reply"
                      required
                      rows={3}
                      placeholder="이곳에 답변을 작성해주세요..."
                      className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border mb-3 resize-none"
                    ></textarea>
                    <div className="flex justify-end">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                        답변 등록하기
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
