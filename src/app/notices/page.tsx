import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NoticesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. target이 'all'이거나
  // 2. target_user_ids 배열에 현재 user.id가 포함된 공지사항만 가져옵니다.
  const { data: notices } = await supabase
    .from('notices')
    .select('*')
    .or(`target.eq.all,target_user_ids.cs.{${user.id}}`)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-4 flex items-center shadow-sm border-b border-gray-100">
        <Link href="/me" className="text-gray-500 hover:text-gray-900 mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">공지사항</h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-md w-full mx-auto space-y-4">
        {!notices || notices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-sm">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-500 font-medium">새로운 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice: any) => (
              <div key={notice.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{notice.title}</h2>
                  {notice.target === 'selected' && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700 ml-2 whitespace-nowrap">
                      개인 공지
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                </p>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {notice.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
