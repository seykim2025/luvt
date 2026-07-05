import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 관리자 상단 네비게이션 */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/admin" className="text-lg font-bold tracking-wider">
          LUV.T ADMIN
        </Link>
        <nav className="flex space-x-4 text-sm font-medium">
          <Link href="/admin/tournaments" className="hover:text-gray-300 transition-colors">
            대회 관리
          </Link>
          <Link href="/admin/checkin" className="hover:text-gray-300 transition-colors">
            오늘의 출석부
          </Link>
          <Link href="/admin/benefits" className="hover:text-gray-300 transition-colors text-yellow-500">
            혜택 관리
          </Link>
          <Link href="/admin/boards" className="hover:text-gray-300 transition-colors">
            게시판 관리
          </Link>
          <Link href="/" className="hover:text-gray-300 transition-colors">
            앱으로
          </Link>
        </nav>
      </header>

      {/* 관리자 컨텐츠 영역 */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
