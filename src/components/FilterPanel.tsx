'use client'

import { useFilterStore, useSelectedRegionStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchRegions, fetchSigungus } from '@/lib/api'

export default function FilterPanel() {
  const { year, sido, sigungu, schoolLevel, setYear, setSido, setSigungu, setSchoolLevel, resetFilters } = useFilterStore()
  const { selectedSido, selectedSigungu, setSelectedSido, setSelectedSigungu } = useSelectedRegionStore()

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
    if (selectedSido) {
      fetchSigungus(selectedSido).then(setSigungus)
    } else {
      setSigungus([])
    }
  }, [selectedSido])

  // 지도에서 선택한 시도를 필터 패널과 동기화
  useEffect(() => {
    if (selectedSido !== sido) {
      setSido(selectedSido)
    }
  }, [selectedSido, sido, setSido])

  // 시군구 동기화
  useEffect(() => {
    if (selectedSigungu !== sigungu) {
      setSigungu(selectedSigungu)
    }
  }, [selectedSigungu, sigungu, setSigungu])

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 bg-white/10 rounded w-24"></div>
          <div className="h-10 bg-white/10 rounded w-32"></div>
          <div className="h-10 bg-white/10 rounded w-32"></div>
          <div className="h-10 bg-white/10 rounded flex-1"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex flex-wrap items-center gap-4">
        {/* 년도 선택 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400 whitespace-nowrap">년도</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[90px]"
          >
            {years.map(y => (
              <option key={y} value={y} className="bg-gray-800">{y}년</option>
            ))}
          </select>
        </div>

        {/* 구분선 */}
        <div className="hidden md:block w-px h-8 bg-white/20"></div>

        {/* 학제 선택 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400 whitespace-nowrap">학제</label>
          <div className="flex gap-1">
            <button
              onClick={() => setSchoolLevel(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  schoolLevel === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {level.replace('학교', '')}
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="hidden md:block w-px h-8 bg-white/20"></div>

        {/* 시도 선택 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400 whitespace-nowrap">지역</label>
          <select
            value={selectedSido || ''}
            onChange={(e) => {
              const value = e.target.value || null
              setSelectedSido(value)
              setSido(value)
            }}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
          >
            <option value="" className="bg-gray-800">전국</option>
            {sidos.map(s => (
              <option key={s} value={s} className="bg-gray-800">{s}</option>
            ))}
          </select>
        </div>

        {/* 시군구 선택 (시도 선택 시에만 표시) */}
        {selectedSido && sigungus.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedSigungu || ''}
              onChange={(e) => {
                const value = e.target.value || null
                setSelectedSigungu(value)
                setSigungu(value)
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="" className="bg-gray-800">전체</option>
              {sigungus.map(sg => (
                <option key={sg} value={sg} className="bg-gray-800">{sg}</option>
              ))}
            </select>
          </div>
        )}

        {/* 초기화 버튼 */}
        <button
          onClick={() => {
            resetFilters()
            setSelectedSido(null)
            setSelectedSigungu(null)
          }}
          className="ml-auto px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
        >
          초기화
        </button>
      </div>
    </div>
  )
}
