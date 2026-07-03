'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleKakaoLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: 'profile_nickname profile_image',
      },
    })
    
    if (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            LUV.T OPEN
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            테니스 대회 멤버십에 로그인하세요.
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-base font-medium rounded-xl text-black bg-[#FEE500] hover:bg-[#FDD800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">로그인 중...</span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M12 3c-5.523 0-10 3.518-10 7.857 0 2.802 1.83 5.253 4.606 6.58-.236.936-.856 3.252-.88 3.398-.035.215.115.21.233.136.166-.104 2.898-1.927 4.05-2.73 1.344.208 2.766.208 4.195.208 5.523 0 10-3.518 10-7.857C22 6.518 17.523 3 12 3z" />
                </svg>
                카카오로 1초 만에 시작하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
