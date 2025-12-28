const API_BASE = '/api'

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
  return data.data
}

export async function fetchSigungus(sido: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/regions?sido=${encodeURIComponent(sido)}`)
  const data = await res.json()
  return data.data
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
  const data = await res.json()
  return data.data
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
