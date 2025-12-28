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
    params.set('limit', '20')
    if (selectedSido) params.set('sido', selectedSido)
    if (selectedSigungu) params.set('sigungu', selectedSigungu)
    if (schoolLevel) params.set('schoolLevel', schoolLevel)

    fetch(`${API_BASE}/schools?${params}`)
      .then(res => res.json())
      .then(data => {
        setSchools(data.data || [])
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
    params.set('limit', '20')
    if (selectedSido) params.set('sido', selectedSido)
    if (selectedSigungu) params.set('sigungu', selectedSigungu)
    if (schoolLevel) params.set('schoolLevel', schoolLevel)

    fetch(`${API_BASE}/schools?${params}`)
      .then(res => res.json())
      .then(data => {
        setSchools(data.data || [])
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

  const getLevelBadgeColor = (level: string) => {
    if (level === '초등학교') return 'bg-green-500/20 text-green-400'
    if (level === '중학교') return 'bg-blue-500/20 text-blue-400'
    return 'bg-purple-500/20 text-purple-400'
  }

  if (loading && schools.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-white/10 rounded w-32"></div>
          <div className="h-10 bg-white/10 rounded"></div>
          <div className="h-10 bg-white/10 rounded"></div>
          <div className="h-10 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">학교 목록</h2>
            <p className="text-xs text-gray-400">
              {selectedSido || '전국'} {selectedSigungu || ''} | {schoolLevel || '전체'} | 총 {total.toLocaleString()}개교
            </p>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">학교명</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">지역</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">학제</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">학생수</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">학급수</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school, idx) => (
              <>
                <tr
                  key={idx}
                  className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                    selectedSchool === school.schoolName ? 'bg-blue-500/10' : ''
                  }`}
                  onClick={() => loadSchoolDetail(school.schoolName)}
                >
                  <td className="px-4 py-3 text-white font-medium">{school.schoolName}</td>
                  <td className="px-4 py-3 text-gray-400">{school.sido} {school.sigungu}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${getLevelBadgeColor(school.schoolLevel)}`}>
                      {school.schoolLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {Number(school.totalStudents).toLocaleString()}
                    <span className="text-gray-500 text-xs ml-1">
                      (남 {Number(school.maleStudents).toLocaleString()} / 여 {Number(school.femaleStudents).toLocaleString()})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{Number(school.totalClasses).toLocaleString()}</td>
                </tr>

                {/* 학교 상세 (학년별) */}
                {selectedSchool === school.schoolName && (
                  <tr>
                    <td colSpan={5} className="bg-white/5 px-4 py-3">
                      {detailLoading ? (
                        <div className="text-center text-gray-400 py-4">로딩 중...</div>
                      ) : schoolDetail?.grades ? (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 mb-2">📚 학년별 현황</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            {schoolDetail.grades.map((grade) => (
                              <div key={grade.grade} className="bg-white/5 rounded-lg p-2 text-center">
                                <p className="text-xs text-gray-400">{grade.grade}학년</p>
                                <p className="text-white font-bold">{Number(grade.totalStudents).toLocaleString()}명</p>
                                <p className="text-xs text-gray-500">
                                  {Number(grade.classCount)}반 | 남 {Number(grade.maleStudents)} 여 {Number(grade.femaleStudents)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-4">데이터 없음</div>
                      )}
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
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => loadPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 bg-white/10 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            이전
          </button>
          <span className="text-sm text-gray-400">
            {page} / {totalPages} 페이지
          </span>
          <button
            onClick={() => loadPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 bg-white/10 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
