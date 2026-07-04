import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
        <p className="text-gray-500">LUV.T 대회를 관리하고 참가자를 승인하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/tournaments" className="block">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-black transition-colors cursor-pointer group">
            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">🏆 대회 관리</h2>
            <p className="text-gray-500 mb-4">새로운 대회를 개설하고 이전 대회 목록을 확인합니다.</p>
            <span className="text-sm font-semibold text-blue-600">바로가기 &rarr;</span>
          </div>
        </Link>

        <Link href="/admin/checkin" className="block">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-black transition-colors cursor-pointer group">
            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">✅ 오늘의 출석부</h2>
            <p className="text-gray-500 mb-4">오늘 진행되는 대회의 참가자를 일괄 승인하고 혜택을 발급합니다.</p>
            <span className="text-sm font-semibold text-green-600">바로가기 &rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
