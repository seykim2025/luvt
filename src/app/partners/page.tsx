import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreatePostForm from './CreatePostForm'
import { updatePartnerPostStatus } from '../actions'

export default async function PartnersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. 파트너 모집 글 조회 (open 상태 위주로 정렬)
  const { data: posts } = await supabase
    .from('partner_posts')
    .select(`
      id,
      message,
      region,
      status,
      created_at,
      user_id,
      profiles (
        name,
        gender,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-4 flex items-center shadow-sm border-b border-gray-100">
        <Link href="/" className="text-gray-500 hover:text-gray-900 mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">파트너 찾기</h1>
      </header>

      <main className="flex-1 px-4 py-6 max-w-md w-full mx-auto space-y-6">
        <CreatePostForm />

        <div className="space-y-4">
          {!posts || posts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">등록된 파트너 모집 글이 없습니다.</p>
            </div>
          ) : (
            posts.map((post: any) => {
              const isOwner = post.user_id === user.id
              const isClosed = post.status !== 'open'
              const date = new Date(post.created_at).toLocaleDateString('ko-KR')

              return (
                <div key={post.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-200 transition-opacity ${isClosed ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                        <span>{post.profiles?.name}</span>
                        {post.profiles?.gender && (
                          <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {post.profiles.gender === 'M' ? '남성' : '여성'}
                          </span>
                        )}
                      </h3>
                      {post.region && (
                        <p className="text-xs text-blue-600 font-medium mt-1">📍 {post.region}</p>
                      )}
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded-md font-semibold ${
                      isClosed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                    }`}>
                      {isClosed ? '모집 완료' : '모집 중'}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm whitespace-pre-wrap mb-4 leading-relaxed">
                    {post.message}
                  </p>

                  <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                    <span className="text-xs text-gray-400">{date}</span>
                    
                    {isOwner && !isClosed && (
                      <form action={async () => {
                        'use server'
                        await updatePartnerPostStatus(post.id, 'matched')
                      }}>
                        <button type="submit" className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                          마감하기
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
