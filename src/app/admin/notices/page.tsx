import { createClient } from '@/utils/supabase/server'
import { createNotice } from '@/app/actions'

export default async function AdminNoticesPage() {
  const supabase = await createClient()

  // 공지사항 조회
  const { data: notices } = await supabase
    .from('notices')
    .select(`
      *,
      profiles (name)
    `)
    .order('created_at', { ascending: false })

  // 전체 유저 조회 (선택 공지 작성용)
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, name, phone')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">공지사항 관리</h1>
        <p className="text-gray-500">전체 유저 또는 특정 유저들에게 공지사항을 발행합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 공지 작성 폼 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">새 공지 작성</h2>
          <form action={async (formData) => {
            'use server'
            await createNotice(formData)
          }} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대상</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="target" value="all" defaultChecked className="text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-800">전체 유저</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="target" value="selected" className="text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-800">선택 유저 (개인 공지)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                선택 유저 ID 목록 (선택 공지일 경우 필수)
              </label>
              <p className="text-xs text-gray-400 mb-2">콤마(,)로 구분하여 입력하세요.</p>
              <textarea
                name="targetUserIds"
                rows={2}
                placeholder="예: 123e4567-e89b-12d3-a456-426614174000, 987fcdeb-51a2-43d7-9012-345678901234"
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border"
              ></textarea>
              
              <details className="mt-2 text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">유저 ID 찾기 (클릭해서 펼치기)</summary>
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                  {allUsers?.map(u => (
                    <div key={u.id} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                      <span>{u.name} ({u.phone})</span>
                      <span className="font-mono text-[10px] text-gray-400 select-all">{u.id}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input 
                type="text" 
                name="title" 
                required 
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
              <textarea 
                name="content" 
                required 
                rows={6}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border resize-none"
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
              공지 등록하기
            </button>
          </form>
        </div>

        {/* 발행된 공지 리스트 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">발행된 공지사항</h2>
          
          {!notices || notices.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">등록된 공지가 없습니다.</p>
          ) : (
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {notices.map((notice: any) => (
                <div key={notice.id} className="p-5 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${notice.target === 'all' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {notice.target === 'all' ? '전체 공지' : '선택 공지'}
                      </span>
                      <h3 className="font-bold text-gray-900">{notice.title}</h3>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(notice.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{notice.content}</p>
                  
                  {notice.target === 'selected' && notice.target_user_ids && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      <strong>대상 유저 ID:</strong> <span className="font-mono">{notice.target_user_ids.join(', ')}</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-400 text-right">
                    작성자: {notice.profiles?.name}
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
