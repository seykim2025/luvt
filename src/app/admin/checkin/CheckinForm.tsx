'use client'

import { useState } from 'react'
import { bulkApprove } from '../actions'

interface CheckinFormProps {
  participations: any[]
}

export default function CheckinForm({ participations }: CheckinFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const handleToggleAll = () => {
    if (selectedIds.size === participations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(participations.map(p => p.id)))
    }
  }

  const handleApprove = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`선택한 ${selectedIds.size}명의 참가자를 승인하시겠습니까?`)) return
    
    setLoading(true)
    try {
      const res = await bulkApprove(Array.from(selectedIds))
      if (!res.ok) {
        alert(res.error)
      } else {
        alert('승인 및 혜택 발급이 완료되었습니다.')
        setSelectedIds(new Set())
      }
    } catch (e) {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (participations.length === 0) {
    return <p className="text-gray-500 text-center py-10">승인 대기 중인 참가자가 없습니다.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={selectedIds.size === participations.length && participations.length > 0}
            onChange={handleToggleAll}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <span className="font-medium text-gray-700">전체 선택</span>
        </label>
        
        <button
          onClick={handleApprove}
          disabled={loading || selectedIds.size === 0}
          className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '처리 중...' : `선택 일괄 승인 (${selectedIds.size})`}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {participations.map((p) => (
          <label key={p.id} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={selectedIds.has(p.id)}
              onChange={() => handleToggle(p.id)}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black mr-4"
            />
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg">{p.profiles?.name}</p>
              <div className="flex space-x-2 mt-1 text-sm text-gray-500">
                <span>{p.profiles?.gender === 'M' ? '남성' : p.profiles?.gender === 'F' ? '여성' : '성별 미상'}</span>
                <span>•</span>
                <span>{p.profiles?.phone || '연락처 없음'}</span>
              </div>
            </div>
            <div className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">
              대기중
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
