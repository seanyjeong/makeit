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

// 지역 비교 그룹
export interface RegionGroup {
  id: string
  name: string
  color: string
  regions: string[] // sido names
}

interface RegionCompareState {
  groups: RegionGroup[]
  addGroup: (name: string, color: string) => void
  removeGroup: (id: string) => void
  addRegionToGroup: (groupId: string, sido: string) => void
  removeRegionFromGroup: (groupId: string, sido: string) => void
  clearGroups: () => void
}

const GROUP_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6']

export const useRegionCompareStore = create<RegionCompareState>((set) => ({
  groups: [],
  addGroup: (name, color) => set((state) => ({
    groups: [...state.groups, {
      id: Date.now().toString(),
      name,
      color,
      regions: []
    }]
  })),
  removeGroup: (id) => set((state) => ({
    groups: state.groups.filter(g => g.id !== id)
  })),
  addRegionToGroup: (groupId, sido) => set((state) => ({
    groups: state.groups.map(g =>
      g.id === groupId && !g.regions.includes(sido)
        ? { ...g, regions: [...g.regions, sido] }
        : g
    )
  })),
  removeRegionFromGroup: (groupId, sido) => set((state) => ({
    groups: state.groups.map(g =>
      g.id === groupId
        ? { ...g, regions: g.regions.filter(r => r !== sido) }
        : g
    )
  })),
  clearGroups: () => set({ groups: [] })
}))

export { GROUP_COLORS }
