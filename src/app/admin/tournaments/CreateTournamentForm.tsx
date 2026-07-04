'use client'

import { useState } from 'react'
import { createTournament } from '../actions'

export default function CreateTournamentForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    try {
      const res = await createTournament(formData)
      if (!res.ok) {
        setError(res.error || '알 수 없는 오류가 발생했습니다.')
      } else {
        // 성공 시 폼 초기화는 formData.entries를 날리기 어렵기 때문에 uncontrolled 리셋
        const form = document.getElementById('create-tournament-form') as HTMLFormElement
        if (form) form.reset()
      }
    } catch (e) {
      setError('서버 통신 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">새 대회 개설</h2>
      
      <form id="create-tournament-form" action={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">대회 이름 (예: LUV.T OPEN)</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            required 
            defaultValue="LUV.T OPEN"
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
          />
        </div>

        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">대회 날짜</label>
          <input 
            type="date" 
            id="event_date" 
            name="event_date" 
            required 
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">상태</label>
          <select 
            id="status" 
            name="status" 
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border bg-white"
          >
            <option value="draft">임시 저장 (draft)</option>
            <option value="open">모집 중 (open)</option>
            <option value="ongoing">진행 중 (ongoing)</option>
            <option value="done">종료됨 (done)</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '개설 중...' : '개설하기'}
        </button>
      </form>
    </div>
  )
}
