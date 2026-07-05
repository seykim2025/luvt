import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateInquiryForm from './CreateInquiryForm'

export default async function InquiryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-4 flex items-center shadow-sm border-b border-gray-100">
        <Link href="/me" className="text-gray-500 hover:text-gray-900 mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">1:1 문의 / 제보</h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-md w-full mx-auto space-y-6">
        <CreateInquiryForm />

        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-gray-900 px-2">나의 문의 내역</h2>
          
          {!inquiries || inquiries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200">
              <span className="text-3xl mb-3 block">💬</span>
              <p className="text-gray-500 font-medium">작성된 문의가 없습니다.</p>
            </div>
          ) : (
            inquiries.map((inq: any) => (
              <div key={inq.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${inq.category === 'report' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {inq.category === 'report' ? '제보' : '일반 문의'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(inq.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                
                <p className="text-gray-800 text-sm whitespace-pre-wrap">{inq.content}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {inq.reply ? (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">답변완료</span>
                        <span className="text-xs text-blue-400 font-medium">{new Date(inq.replied_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <p className="text-blue-900 text-sm whitespace-pre-wrap">{inq.reply}</p>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-gray-400 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      관리자 답변 대기 중
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
