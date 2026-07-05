'use client'

import { useState } from 'react'
import { createInquiry } from '@/app/actions'

export default function CreateInquiryForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const res = await createInquiry(formData)
      if (res.ok) {
        setIsOpen(false)
      } else {
        alert(res.error)
      }
    } catch (e) {
      alert('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-black text-white rounded-2xl py-4 font-bold shadow-md hover:bg-gray-800 transition-colors"
      >
        + 1:1 문의 / 제보 남기기
      </button>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">새 문의/제보 작성</h2>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
          <select name="category" className="w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black p-3 border bg-gray-50">
            <option value="general">일반 문의</option>
            <option value="report">버그 및 악성 유저 제보</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea
            name="content"
            required
            rows={5}
            placeholder="궁금한 점이나 제보하실 내용을 자세히 적어주세요."
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black p-3 border bg-gray-50 resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-xl py-3 font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? '등록 중...' : '등록하기'}
        </button>
      </form>
    </div>
  )
}
