'use client'

import { useState } from 'react'
import { submitOnboarding } from './actions'

import Image from 'next/image'

import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await submitOnboarding(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      router.refresh()
      router.replace('/')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.jpg"
              alt="LUV.T Logo"
              width={64}
              height={64}
              priority
              className="rounded-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">환영합니다! 🎉</h1>
          <p className="mt-2 text-gray-600">
            원활한 대회 진행을 위해 간단한 프로필을 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              이름 (필수)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              연락처 (필수)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              성별 (선택)
            </label>
            <select
              id="gender"
              name="gender"
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border bg-white"
            >
              <option value="">선택 안함</option>
              <option value="M">남성 (M)</option>
              <option value="F">여성 (F)</option>
            </select>
          </div>

          <div>
            <label htmlFor="birth_ym" className="block text-sm font-medium text-gray-700">
              출생연월 (선택)
            </label>
            <input
              id="birth_ym"
              name="birth_ym"
              type="month"
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
            />
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
              주 활동 지역 (선택)
            </label>
            <input
              id="region"
              name="region"
              type="text"
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
              placeholder="예: 서울 강남구"
            />
          </div>

          <div>
            <label htmlFor="tennis_started_on" className="block text-sm font-medium text-gray-700">
              테니스 시작일 (선택)
            </label>
            <input
              id="tennis_started_on"
              name="tennis_started_on"
              type="date"
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
            />
          </div>

          <div>
            <label htmlFor="dominant_hand" className="block text-sm font-medium text-gray-700">
              주 사용 손 (선택)
            </label>
            <select
              id="dominant_hand"
              name="dominant_hand"
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border bg-white"
            >
              <option value="">선택 안함</option>
              <option value="R">오른손</option>
              <option value="L">왼손</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
          >
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
