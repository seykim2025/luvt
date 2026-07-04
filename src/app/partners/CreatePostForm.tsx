'use client'

import { useState } from 'react'
import { createPartnerPost } from '../actions'

export default function CreatePostForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    try {
      const res = await createPartnerPost(formData)
      if (!res.ok) {
        setError(res.error || '게시물 등록 실패')
      } else {
        const form = document.getElementById('create-post-form') as HTMLFormElement
        if (form) form.reset()
        setIsExpanded(false)
      }
    } catch (e) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-md hover:bg-gray-800 transition-colors"
      >
        + 새 파트너 모집 글쓰기
      </button>
    )
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900">새 파트너 모집</h3>
        <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <form id="create-post-form" action={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">지역 (선택)</label>
          <input 
            type="text" 
            id="region" 
            name="region" 
            placeholder="예: 강남구, 분당 등"
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">내용 (필수)</label>
          <textarea 
            id="message" 
            name="message" 
            required
            rows={3}
            placeholder="NTRP, 원하는 플레이 스타일 등을 자유롭게 적어주세요."
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '등록 중...' : '등록하기'}
        </button>
      </form>
    </div>
  )
}
