// 프로덕션: https://chejump.com/stats-api
// 로컬: 빈 문자열 (Next.js API routes 사용)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface RegionsData {
  sidos: string[]
  years: number[]
  schoolLevels: string[]
}

export interface SummaryData {
  total: {
    students: number
    maleStudents: number
    femaleStudents: number
    classes: number
    schools: number
  }
  bySchoolLevel: {
    schoolLevel: string
    students: number
    schools: number
  }[]
  bySido: {
    sido: string
    students: number
    schools: number
  }[]
}

export interface TrendData {
  year: number
  totalStudents: number
  maleStudents: number
  femaleStudents: number
  totalClasses: number
  schoolCount: number
}

export interface MapData {
  sido: string
  totalStudents: number
  maleStudents: number
  femaleStudents: number
  schoolCount: number
  coordinates: [number, number]
}

// API 함수들
export async function fetchRegions(): Promise<RegionsData> {
  const res = await fetch(`${API_BASE}/regions`)
  const data = await res.json()
  return {
    sidos: data.sidos || [],
    years: [2025, 2024, 2023, 2022, 2021, 2020],
    schoolLevels: ['초등학교', '중학교', '고등학교']
  }
}

export async function fetchSigungus(sido: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/regions`)
  const data = await res.json()
  return data.sigungus?.[sido] || []
}

export async function fetchSummary(year: number, schoolLevel?: string): Promise<SummaryData> {
  let url = `${API_BASE}/statistics/summary?year=${year}`
  if (schoolLevel) url += `&schoolLevel=${encodeURIComponent(schoolLevel)}`
  const res = await fetch(url)
  const data = await res.json()
  return data.data
}

export async function fetchTrend(
  sido?: string,
  sigungu?: string,
  schoolLevel?: string
): Promise<TrendData[]> {
  const params = new URLSearchParams()
  if (sido) params.set('sido', sido)
  if (sigungu) params.set('sigungu', sigungu)
  if (schoolLevel) params.set('schoolLevel', schoolLevel)

  const res = await fetch(`${API_BASE}/statistics/trend?${params}`)
  return await res.json()
}

export async function fetchMapData(
  year: number,
  schoolLevel?: string
): Promise<{ meta: { maxStudents: number; minStudents: number }; data: MapData[] }> {
  let url = `${API_BASE}/statistics/map?year=${year}`
  if (schoolLevel) url += `&schoolLevel=${encodeURIComponent(schoolLevel)}`
  const res = await fetch(url)
  const json = await res.json()
  return { meta: json.meta, data: json.data }
}
