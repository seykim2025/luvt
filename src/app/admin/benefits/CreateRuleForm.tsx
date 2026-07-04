'use client'

import { useState } from 'react'
import { createBenefitRule } from '@/app/actions'

export default function CreateRuleForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    try {
      const res = await createBenefitRule(formData)
      if (!res.ok) {
        setError(res.error || '알 수 없는 오류가 발생했습니다.')
      } else {
        const form = document.getElementById('create-rule-form') as HTMLFormElement
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
      <h2 className="text-lg font-bold text-gray-900 mb-4">새 혜택 규칙 생성</h2>
      
      <form id="create-rule-form" action={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">달성 횟수</label>
          <input 
            type="number" 
            id="threshold" 
            name="threshold" 
            required 
            placeholder="예: 3"
            min="1"
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
          />
        </div>

        <div>
          <label htmlFor="reward" className="block text-sm font-medium text-gray-700">보상 내용</label>
          <input 
            type="text" 
            id="reward" 
            name="reward" 
            required 
            placeholder="예: 스포츠 음료 1병 무료"
            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '생성 중...' : '규칙 생성하기'}
        </button>
      </form>
    </div>
  )
}
