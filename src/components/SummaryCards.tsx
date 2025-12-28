'use client'

import { useFilterStore, useSelectedRegionStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchSummary, SummaryData } from '@/lib/api'

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '만'
  }
  return num.toLocaleString()
}

export default function SummaryCards() {
  const { year, schoolLevel } = useFilterStore()
  const { selectedSido, selectedSigungu } = useSelectedRegionStore()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchSummary(year, schoolLevel || undefined).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [year, schoolLevel])

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-5 animate-pulse h-[120px]">
            <div className="h-4 bg-white/10 rounded w-20 mb-3"></div>
            <div className="h-10 bg-white/10 rounded w-28"></div>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: '총 학생수',
      value: data.total.students,
      subValue: `${year}년 기준`,
      color: 'border-blue-500/30',
      textColor: 'text-blue-400',
      bgGradient: 'from-blue-500/10 to-blue-500/5'
    },
    {
      label: '남학생',
      value: data.total.maleStudents,
      subValue: `${Math.round((data.total.maleStudents / data.total.students) * 100)}%`,
      color: 'border-sky-500/30',
      textColor: 'text-sky-400',
      bgGradient: 'from-sky-500/10 to-sky-500/5'
    },
    {
      label: '여학생',
      value: data.total.femaleStudents,
      subValue: `${Math.round((data.total.femaleStudents / data.total.students) * 100)}%`,
      color: 'border-pink-500/30',
      textColor: 'text-pink-400',
      bgGradient: 'from-pink-500/10 to-pink-500/5'
    },
    {
      label: '학교수',
      value: data.total.schools,
      subValue: schoolLevel || '초·중·고',
      color: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      bgGradient: 'from-emerald-500/10 to-emerald-500/5'
    }
  ]

  return (
    <div>
      {/* 현재 필터 표시 */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">현재 조회:</span>
        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">{year}년</span>
        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
          {selectedSigungu ? `${selectedSido} ${selectedSigungu}` : selectedSido || '전국'}
        </span>
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
          {schoolLevel || '전체'}
        </span>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm rounded-xl p-5 border ${card.color} h-[120px] flex flex-col justify-between`}
          >
            <p className="text-sm text-gray-400">{card.label}</p>
            <div>
              <p className={`text-3xl font-bold ${card.textColor}`}>
                {formatNumber(card.value)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {typeof card.value === 'number' && card.value > 9999
                  ? card.value.toLocaleString() + (card.label === '학교수' ? '개' : '명')
                  : card.subValue}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
