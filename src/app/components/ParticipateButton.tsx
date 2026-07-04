'use client'

import { useState } from 'react'
import { participateToday } from '../actions'

interface Props {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  disabledReason?: string
}

export default function ParticipateButton({ status, disabledReason }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await participateToday()
      if (!result?.ok) {
        setError(result?.error || '오류가 발생했습니다.')
      }
    } catch (e) {
      setError('서버와 통신 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  let buttonText = '오늘 대회 참가하기'
  let buttonClasses = 'w-full py-6 rounded-2xl text-xl font-bold text-white shadow-lg transition-all '
  let isDisabled = disabledReason !== undefined || status !== 'none' || loading

  if (disabledReason) {
    buttonText = disabledReason
    buttonClasses += 'bg-gray-300 cursor-not-allowed'
  } else if (status === 'pending') {
    buttonText = '참가 접수됨 (관리자 확인 대기)'
    buttonClasses += 'bg-blue-500 cursor-not-allowed'
  } else if (status === 'approved') {
    buttonText = '참가 완료 ✓ 스탬프 +1'
    buttonClasses += 'bg-green-500 cursor-not-allowed'
  } else if (status === 'rejected') {
    buttonText = '참가 거절됨'
    buttonClasses += 'bg-red-500 cursor-not-allowed'
  } else {
    // none (available)
    buttonClasses += 'bg-black hover:bg-gray-800 active:scale-95'
  }

  if (loading) {
    buttonText = '처리 중...'
  }

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={buttonClasses}
      >
        {buttonText}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-500 text-center font-medium">{error}</p>
      )}
    </div>
  )
}
