'use client'

import { useFilterStore, useSelectedRegionStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchMapData, MapData } from '@/lib/api'

export default function MapSection() {
  const { year, schoolLevel } = useFilterStore()
  const { selectedSido, setSelectedSido } = useSelectedRegionStore()
  const [data, setData] = useState<MapData[]>([])
  const [meta, setMeta] = useState<{ maxStudents: number; minStudents: number }>({ maxStudents: 0, minStudents: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchMapData(year, schoolLevel || undefined).then(result => {
      setData(result.data)
      setMeta(result.meta)
      setLoading(false)
    })
  }, [year, schoolLevel])

  // 색상 스케일 함수
  const getColor = (value: number): string => {
    const ratio = (value - meta.minStudents) / (meta.maxStudents - meta.minStudents)
    if (ratio > 0.8) return 'from-red-500 to-red-600'
    if (ratio > 0.6) return 'from-orange-500 to-orange-600'
    if (ratio > 0.4) return 'from-yellow-500 to-yellow-600'
    if (ratio > 0.2) return 'from-green-500 to-green-600'
    return 'from-blue-500 to-blue-600'
  }

  // 높이 계산 (3D 효과용)
  const getHeight = (value: number): number => {
    const ratio = (value - meta.minStudents) / (meta.maxStudents - meta.minStudents)
    return Math.max(40, ratio * 200)
  }

  if (loading) {
    return (
      <div className="h-full bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">지도 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">지역별 학생수 분포</h2>
          <p className="text-xs text-gray-400">{year}년 기준 {schoolLevel || '전체'}</p>
        </div>
        {selectedSido && (
          <button
            onClick={() => setSelectedSido(null)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            선택 해제
          </button>
        )}
      </div>

      {/* 3D 바 차트 형태의 지도 (임시) */}
      <div className="p-4 h-[calc(100%-60px)] overflow-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {data.map(region => (
            <button
              key={region.sido}
              onClick={() => setSelectedSido(region.sido === selectedSido ? null : region.sido)}
              className={`relative group transition-all ${
                selectedSido === region.sido
                  ? 'ring-2 ring-blue-500 scale-105'
                  : 'hover:scale-105'
              }`}
            >
              {/* 3D 바 효과 */}
              <div
                className="relative mx-auto rounded-t-lg overflow-hidden shadow-lg transition-all"
                style={{
                  width: '60px',
                  height: `${getHeight(region.totalStudents)}px`,
                  perspective: '1000px'
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${getColor(region.totalStudents)}`}></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>

                {/* 반짝임 효과 */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/3"></div>
              </div>

              {/* 라벨 */}
              <div className="mt-2 text-center">
                <p className="text-xs font-medium text-white">{region.sido}</p>
                <p className="text-[10px] text-gray-400">
                  {(region.totalStudents / 10000).toFixed(1)}만명
                </p>
              </div>

              {/* 호버 툴팁 */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-white/10">
                <p className="font-medium text-white">{region.sido}</p>
                <p className="text-gray-400">학생수: {region.totalStudents.toLocaleString()}명</p>
                <p className="text-gray-400">학교수: {region.schoolCount.toLocaleString()}개</p>
              </div>
            </button>
          ))}
        </div>

        {/* 범례 */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="text-xs text-gray-400">적음</span>
          <div className="flex gap-1">
            <div className="w-6 h-3 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="w-6 h-3 rounded bg-gradient-to-r from-green-500 to-green-600"></div>
            <div className="w-6 h-3 rounded bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
            <div className="w-6 h-3 rounded bg-gradient-to-r from-orange-500 to-orange-600"></div>
            <div className="w-6 h-3 rounded bg-gradient-to-r from-red-500 to-red-600"></div>
          </div>
          <span className="text-xs text-gray-400">많음</span>
        </div>
      </div>
    </div>
  )
}
