'use client'

import { useFilterStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchRegions, fetchSigungus } from '@/lib/api'

export default function FilterPanel() {
  const { year, sido, sigungu, schoolLevel, setYear, setSido, setSigungu, setSchoolLevel, resetFilters } = useFilterStore()

  const [years, setYears] = useState<number[]>([])
  const [sidos, setSidos] = useState<string[]>([])
  const [sigungus, setSigungus] = useState<string[]>([])
  const [schoolLevels, setSchoolLevels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // 초기 데이터 로드
  useEffect(() => {
    fetchRegions().then(data => {
      setYears(data.years)
      setSidos(data.sidos)
      setSchoolLevels(data.schoolLevels)
      setLoading(false)
    })
  }, [])

  // 시도 변경 시 시군구 로드
  useEffect(() => {
    if (sido) {
      fetchSigungus(sido).then(setSigungus)
    } else {
      setSigungus([])
    }
  }, [sido])

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 animate-pulse">
        <div className="h-8 bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-white/10 rounded"></div>
          <div className="h-10 bg-white/10 rounded"></div>
          <div className="h-10 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">필터</h3>
        <button
          onClick={resetFilters}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          초기화
        </button>
      </div>

      <div className="space-y-4">
        {/* 년도 선택 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">년도</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(y => (
              <option key={y} value={y} className="bg-gray-800">{y}년</option>
            ))}
          </select>
        </div>

        {/* 학제 선택 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">학제</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSchoolLevel(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                schoolLevel === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              전체
            </button>
            {schoolLevels.map(level => (
              <button
                key={level}
                onClick={() => setSchoolLevel(level as '초등학교' | '중학교' | '고등학교')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  schoolLevel === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* 시도 선택 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">시도</label>
          <select
            value={sido || ''}
            onChange={(e) => setSido(e.target.value || null)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" className="bg-gray-800">전국</option>
            {sidos.map(s => (
              <option key={s} value={s} className="bg-gray-800">{s}</option>
            ))}
          </select>
        </div>

        {/* 시군구 선택 (시도 선택 시에만 표시) */}
        {sido && sigungus.length > 0 && (
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">시군구</label>
            <select
              value={sigungu || ''}
              onChange={(e) => setSigungu(e.target.value || null)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-gray-800">전체</option>
              {sigungus.map(sg => (
                <option key={sg} value={sg} className="bg-gray-800">{sg}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
