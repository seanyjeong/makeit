import { create } from 'zustand'

type SchoolLevel = '초등학교' | '중학교' | '고등학교' | null

interface FilterState {
  year: number
  sido: string | null
  sigungu: string | null
  schoolLevel: SchoolLevel
  setYear: (year: number) => void
  setSido: (sido: string | null) => void
  setSigungu: (sigungu: string | null) => void
  setSchoolLevel: (level: SchoolLevel) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  year: 2025,
  sido: null,
  sigungu: null,
  schoolLevel: null,
  setYear: (year) => set({ year }),
  setSido: (sido) => set({ sido, sigungu: null }), // 시도 변경 시 시군구 초기화
  setSigungu: (sigungu) => set({ sigungu }),
  setSchoolLevel: (schoolLevel) => set({ schoolLevel }),
  resetFilters: () => set({ year: 2025, sido: null, sigungu: null, schoolLevel: null })
}))

// 선택된 지역 정보
interface SelectedRegionState {
  selectedSido: string | null
  selectedSigungu: string | null
  setSelectedSido: (sido: string | null) => void
  setSelectedSigungu: (sigungu: string | null) => void
}

export const useSelectedRegionStore = create<SelectedRegionState>((set) => ({
  selectedSido: null,
  selectedSigungu: null,
  setSelectedSido: (sido) => set({ selectedSido: sido, selectedSigungu: null }),
  setSelectedSigungu: (sigungu) => set({ selectedSigungu: sigungu })
}))
