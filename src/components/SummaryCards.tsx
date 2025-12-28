'use client'

import { useFilterStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchSummary, SummaryData } from '@/lib/api'

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K'
  }
  return num.toLocaleString()
}

export default function SummaryCards() {
  const { year, schoolLevel } = useFilterStore()
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-20 mb-2"></div>
            <div className="h-8 bg-white/10 rounded w-24"></div>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: '총 학생수',
      value: data.total.students,
      icon: '👨‍🎓',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: '남학생',
      value: data.total.maleStudents,
      icon: '👦',
      color: 'from-sky-500 to-blue-500'
    },
    {
      label: '여학생',
      value: data.total.femaleStudents,
      icon: '👧',
      color: 'from-pink-500 to-rose-500'
    },
    {
      label: '학교수',
      value: data.total.schools,
      icon: '🏫',
      color: 'from-emerald-500 to-teal-500'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="relative overflow-hidden bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 group hover:border-white/20 transition-all"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{card.icon}</span>
              <span className="text-sm text-gray-400">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatNumber(card.value)}
            </p>
            {card.value > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {card.value.toLocaleString()}명
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
