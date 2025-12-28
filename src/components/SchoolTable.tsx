'use client'

import { useFilterStore, useSelectedRegionStore } from '@/lib/store'
import { useEffect, useState } from 'react'

interface School {
  schoolName: string
  sido: string
  sigungu: string
  schoolLevel: string
  totalStudents: number
  maleStudents: number
  femaleStudents: number
  totalClasses: number
}

interface GradeDetail {
  grade: number
  classCount: number
  totalStudents: number
  maleStudents: number
  femaleStudents: number
}

interface SchoolDetail {
  school: {
    schoolName: string
    sido: string
    sigungu: string
    schoolLevel: string
  }
  grades: GradeDetail[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export default function SchoolTable() {
  const { year, schoolLevel } = useFilterStore()
  const { selectedSido, selectedSigungu } = useSelectedRegionStore()

  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [schoolDetail, setSchoolDetail] = useState<SchoolDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // 학교 목록 로드
  useEffect(() => {
    setLoading(true)
    setPage(1)

    const params = new URLSearchParams()
    params.set('year', year.toString())
    params.set('page', '1')
    params.set('limit', '15')
    if (selectedSido) params.set('sido', selectedSido)
    if (selectedSigungu) params.set('sigungu', selectedSigungu)
    if (schoolLevel) params.set('schoolLevel', schoolLevel)

    fetch(`${API_BASE}/schools?${params}`)
      .then(res => res.json())
      .then(data => {
        setSchools((data.data || []).map((s: School) => ({
          ...s,
          totalStudents: Number(s.totalStudents),
          maleStudents: Number(s.maleStudents),
          femaleStudents: Number(s.femaleStudents),
          totalClasses: Number(s.totalClasses)
        })))
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [year, selectedSido, selectedSigungu, schoolLevel])

  // 페이지 변경
  const loadPage = (newPage: number) => {
    setLoading(true)
    setPage(newPage)

    const params = new URLSearchParams()
    params.set('year', year.toString())
    params.set('page', newPage.toString())
    params.set('limit', '15')
    if (selectedSido) params.set('sido', selectedSido)
    if (selectedSigungu) params.set('sigungu', selectedSigungu)
    if (schoolLevel) params.set('schoolLevel', schoolLevel)

    fetch(`${API_BASE}/schools?${params}`)
      .then(res => res.json())
      .then(data => {
        setSchools((data.data || []).map((s: School) => ({
          ...s,
          totalStudents: Number(s.totalStudents),
          maleStudents: Number(s.maleStudents),
          femaleStudents: Number(s.femaleStudents),
          totalClasses: Number(s.totalClasses)
        })))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  // 학교 상세 로드
  const loadSchoolDetail = (schoolName: string) => {
    if (selectedSchool === schoolName) {
      setSelectedSchool(null)
      setSchoolDetail(null)
      return
    }

    setSelectedSchool(schoolName)
    setDetailLoading(true)

    fetch(`${API_BASE}/schools/${encodeURIComponent(schoolName)}/detail?year=${year}`)
      .then(res => res.json())
      .then(data => {
        setSchoolDetail(data)
        setDetailLoading(false)
      })
      .catch(() => setDetailLoading(false))
  }

  // 정렬된 데이터
  const sortedSchools = [...schools].sort((a, b) =>
    sortOrder === 'desc'
      ? b.totalStudents - a.totalStudents
      : a.totalStudents - b.totalStudents
  )

  const getLevelBadgeColor = (level: string) => {
    if (level === '초등학교') return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (level === '중학교') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }

  if (loading && schools.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-[500px]">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-white/10 rounded w-32"></div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden h-[500px] flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">학교 목록</h2>
            <p className="text-xs text-gray-400">
              {selectedSigungu
                ? `${selectedSido} ${selectedSigungu}`
                : selectedSido || '전국'} · {schoolLevel || '전체'} · 총 {total.toLocaleString()}개교
            </p>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors"
          >
            학생수 {sortOrder === 'desc' ? '▼ 많은순' : '▲ 적은순'}
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-800/95 backdrop-blur-sm">
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-2 text-gray-400 font-medium">학교명</th>
              <th className="text-center px-4 py-2 text-gray-400 font-medium hidden md:table-cell">지역</th>
              <th className="text-center px-4 py-2 text-gray-400 font-medium">학제</th>
              <th className="text-right px-4 py-2 text-gray-400 font-medium">학생수</th>
              <th className="text-right px-4 py-2 text-gray-400 font-medium hidden sm:table-cell">학급</th>
            </tr>
          </thead>
          <tbody>
            {sortedSchools.map((school) => (
              <>
                <tr
                  key={school.schoolName}
                  className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                    selectedSchool === school.schoolName ? 'bg-blue-500/10' : ''
                  }`}
                  onClick={() => loadSchoolDetail(school.schoolName)}
                >
                  <td className="px-4 py-2.5">
                    <p className="text-white font-medium">{school.schoolName}</p>
                    <p className="text-[10px] text-gray-500 md:hidden">{school.sido} {school.sigungu}</p>
                  </td>
                  <td className="px-4 py-2.5 text-center text-gray-400 text-xs hidden md:table-cell">
                    {school.sido} {school.sigungu}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getLevelBadgeColor(school.schoolLevel)}`}>
                      {school.schoolLevel.replace('학교', '')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-white font-medium">{school.totalStudents.toLocaleString()}</span>
                    <span className="text-gray-500 text-[10px] ml-1 hidden sm:inline">
                      (남{school.maleStudents.toLocaleString()}/여{school.femaleStudents.toLocaleString()})
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-400 hidden sm:table-cell">
                    {school.totalClasses.toLocaleString()}
                  </td>
                </tr>

                {/* 학교 상세 (학년별) - 모달 스타일 */}
                {selectedSchool === school.schoolName && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-4 border-y border-blue-500/20">
                        {detailLoading ? (
                          <div className="text-center text-gray-400 py-6">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            로딩 중...
                          </div>
                        ) : schoolDetail?.grades && schoolDetail.grades.length > 0 ? (
                          <div className="max-w-2xl mx-auto">
                            <div className="text-center mb-4">
                              <h3 className="text-white font-bold text-lg">{school.schoolName}</h3>
                              <p className="text-xs text-gray-400">{school.sido} {school.sigungu} · {year}년 학년별 현황</p>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                              {schoolDetail.grades.map((grade) => (
                                <div key={grade.grade} className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                                  <p className="text-xs text-blue-400 font-medium mb-1">{grade.grade}학년</p>
                                  <p className="text-xl font-bold text-white">{Number(grade.totalStudents).toLocaleString()}</p>
                                  <p className="text-[10px] text-gray-500">명</p>
                                  <div className="mt-2 pt-2 border-t border-white/10">
                                    <p className="text-[10px] text-gray-400">{Number(grade.classCount)}반</p>
                                    <div className="flex justify-center gap-2 mt-1">
                                      <span className="text-[10px] text-blue-400">남 {Number(grade.maleStudents)}</span>
                                      <span className="text-[10px] text-pink-400">여 {Number(grade.femaleStudents)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-6">상세 데이터 없음</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => loadPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            ← 이전
          </button>
          <span className="text-xs text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => loadPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  )
}
