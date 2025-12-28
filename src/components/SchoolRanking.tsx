'use client'

import { useFilterStore, useSelectedRegionStore } from '@/lib/store'
import { useEffect, useState } from 'react'

interface School {
  schoolName: string
  sido: string
  sigungu: string
  schoolLevel: string
  totalStudents: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export default function SchoolRanking() {
  const { year, schoolLevel } = useFilterStore()
  const { selectedSido, selectedSigungu } = useSelectedRegionStore()

  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    setLoading(true)

    const params = new URLSearchParams()
    params.set('year', year.toString())
    params.set('limit', '10')
    if (selectedSido) params.set('sido', selectedSido)
    if (selectedSigungu) params.set('sigungu', selectedSigungu)
    if (schoolLevel) params.set('schoolLevel', schoolLevel)

    fetch(`${API_BASE}/schools?${params}`)
      .then(res => res.json())
      .then(data => {
        const sorted = (data.data || []).map((s: School) => ({
          ...s,
          totalStudents: Number(s.totalStudents)
        }))
        setSchools(sorted)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [year, selectedSido, selectedSigungu, schoolLevel])

  // 정렬된 데이터
  const sortedSchools = [...schools].sort((a, b) =>
    sortOrder === 'desc'
      ? b.totalStudents - a.totalStudents
      : a.totalStudents - b.totalStudents
  )

  const getLevelColor = (level: string) => {
    if (level === '초등학교') return 'text-green-400'
    if (level === '중학교') return 'text-blue-400'
    return 'text-purple-400'
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    if (rank === 2) return 'bg-gray-400/20 text-gray-300 border-gray-400/30'
    if (rank === 3) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    return 'bg-white/5 text-gray-500 border-white/10'
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-[500px]">
        <div className="h-6 bg-white/10 rounded w-32 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden h-[500px] flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">학교 랭킹 TOP 10</h2>
            <p className="text-xs text-gray-400">
              {selectedSigungu
                ? `${selectedSido} ${selectedSigungu}`
                : selectedSido || '전국'} · {schoolLevel || '전체'}
            </p>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors flex items-center gap-1"
          >
            {sortOrder === 'desc' ? '▼ 많은순' : '▲ 적은순'}
          </button>
        </div>
      </div>

      {/* 랭킹 목록 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedSchools.length === 0 ? (
          <div className="text-center text-gray-400 py-8">데이터 없음</div>
        ) : (
          sortedSchools.map((school, idx) => (
            <div
              key={school.schoolName}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {/* 순위 */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${getRankBadge(idx + 1)}`}>
                {idx + 1}
              </div>

              {/* 학교 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{school.schoolName}</p>
                <p className="text-xs text-gray-500">
                  {school.sido} {school.sigungu} · <span className={getLevelColor(school.schoolLevel)}>{school.schoolLevel}</span>
                </p>
              </div>

              {/* 학생수 */}
              <div className="text-right">
                <p className="text-white font-bold">{school.totalStudents.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">명</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
