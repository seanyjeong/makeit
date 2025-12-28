export type SchoolLevel = '초등학교' | '중학교' | '고등학교'

export interface StudentStatistics {
  id: number
  year: number
  sido: string
  sigungu: string | null
  schoolLevel: SchoolLevel
  totalStudents: number
  maleStudents: number
  femaleStudents: number
  totalClasses: number
  schoolCount: number
}

export interface StatisticsFilter {
  year?: number
  sido?: string
  sigungu?: string
  schoolLevel?: SchoolLevel
}

export interface RegionStatistics {
  sido: string
  sigungu?: string
  totalStudents: number
  maleStudents: number
  femaleStudents: number
  schoolCount: number
  // 년도별 추이 데이터
  trend?: YearlyTrend[]
}

export interface YearlyTrend {
  year: number
  totalStudents: number
  maleStudents: number
  femaleStudents: number
}

export interface SummaryStats {
  totalStudents: number
  totalSchools: number
  totalClasses: number
  bySchoolLevel: {
    schoolLevel: string
    count: number
  }[]
  bySido: {
    sido: string
    count: number
  }[]
}

// 지도 시각화용 타입
export interface MapRegionData {
  sido: string
  sigungu?: string
  value: number
  coordinates: [number, number] // [lng, lat]
}
