'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Map } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { GeoJsonLayer } from '@deck.gl/layers'
import { useFilterStore, useSelectedRegionStore } from '@/lib/store'
import { fetchMapData, MapData } from '@/lib/api'
import 'maplibre-gl/dist/maplibre-gl.css'

// 시도명 매핑 (GeoJSON → DB)
const SIDO_MAP: Record<string, string> = {
  '서울특별시': '서울',
  '부산광역시': '부산',
  '대구광역시': '대구',
  '인천광역시': '인천',
  '광주광역시': '광주',
  '대전광역시': '대전',
  '울산광역시': '울산',
  '세종특별자치시': '세종',
  '경기도': '경기',
  '강원도': '강원',
  '충청북도': '충북',
  '충청남도': '충남',
  '전라북도': '전북',
  '전라남도': '전남',
  '경상북도': '경북',
  '경상남도': '경남',
  '제주특별자치도': '제주'
}

// 초기 뷰 상태
const INITIAL_VIEW_STATE = {
  longitude: 127.5,
  latitude: 36.0,
  zoom: 6.5,
  pitch: 45,
  bearing: -10
}

// 색상 스케일 함수
function getColor(value: number, min: number, max: number): [number, number, number, number] {
  const ratio = (value - min) / (max - min || 1)

  if (ratio > 0.8) return [239, 68, 68, 220]     // red
  if (ratio > 0.6) return [249, 115, 22, 220]    // orange
  if (ratio > 0.4) return [234, 179, 8, 220]     // yellow
  if (ratio > 0.2) return [34, 197, 94, 220]     // green
  return [59, 130, 246, 220]                      // blue
}

interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    name: string
    name_eng: string
    code: string
  }
  geometry: {
    type: string
    coordinates: number[][][]
  }
}

interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export default function Map3D() {
  const { year, schoolLevel } = useFilterStore()
  const { selectedSido, setSelectedSido } = useSelectedRegionStore()

  const [geoData, setGeoData] = useState<GeoJSONData | null>(null)
  const [statsData, setStatsData] = useState<MapData[]>([])
  const [meta, setMeta] = useState({ maxStudents: 1, minStudents: 0 })
  const [hoverInfo, setHoverInfo] = useState<{
    x: number
    y: number
    sido: string
    data: MapData | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  // GeoJSON 로드
  useEffect(() => {
    fetch('/data/korea-provinces.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
  }, [])

  // 통계 데이터 로드
  useEffect(() => {
    setLoading(true)
    fetchMapData(year, schoolLevel || undefined).then(result => {
      setStatsData(result.data)
      setMeta(result.meta)
      setLoading(false)
    })
  }, [year, schoolLevel])

  // 통계 데이터를 시도명으로 인덱싱
  const statsMap = useMemo(() => {
    const map: Record<string, MapData> = {}
    statsData.forEach(d => {
      map[d.sido] = d
    })
    return map
  }, [statsData])

  // GeoJSON에 통계 데이터 병합
  const mergedGeoData = useMemo(() => {
    if (!geoData) return null

    return {
      ...geoData,
      features: geoData.features.map(feature => {
        const dbName = SIDO_MAP[feature.properties.name] || feature.properties.name
        const stats = statsMap[dbName]

        return {
          ...feature,
          properties: {
            ...feature.properties,
            dbName,
            totalStudents: stats?.totalStudents || 0,
            schoolCount: stats?.schoolCount || 0,
            maleStudents: stats?.maleStudents || 0,
            femaleStudents: stats?.femaleStudents || 0
          }
        }
      })
    }
  }, [geoData, statsMap])

  // 클릭 핸들러
  const onClick = useCallback((info: { object?: { properties?: { dbName?: string } } }) => {
    if (info.object?.properties?.dbName) {
      const sido = info.object.properties.dbName
      setSelectedSido(sido === selectedSido ? null : sido)
    }
  }, [selectedSido, setSelectedSido])

  // 호버 핸들러
  const onHover = useCallback((info: {
    x?: number
    y?: number
    object?: { properties?: { dbName?: string; totalStudents?: number; schoolCount?: number } }
  }) => {
    if (info.object?.properties?.dbName) {
      const dbName = info.object.properties.dbName
      setHoverInfo({
        x: info.x || 0,
        y: info.y || 0,
        sido: dbName,
        data: statsMap[dbName] || null
      })
    } else {
      setHoverInfo(null)
    }
  }, [statsMap])

  // deck.gl 레이어
  const layers = useMemo(() => {
    if (!mergedGeoData) return []

    return [
      new GeoJsonLayer({
        id: 'korea-provinces',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: mergedGeoData as any,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: true,
        wireframe: false,

        // 3D 높이 (학생수에 비례)
        getElevation: (d: { properties: { totalStudents: number } }) => {
          const students = d.properties.totalStudents || 0
          const ratio = (students - meta.minStudents) / (meta.maxStudents - meta.minStudents || 1)
          return ratio * 100000 // 최대 100km 높이
        },

        // 채우기 색상
        getFillColor: (d: { properties: { dbName: string; totalStudents: number } }) => {
          const isSelected = d.properties.dbName === selectedSido
          const students = d.properties.totalStudents || 0

          if (isSelected) {
            return [255, 255, 255, 255] as [number, number, number, number]
          }

          return getColor(students, meta.minStudents, meta.maxStudents)
        },

        // 외곽선 색상
        getLineColor: (d: { properties: { dbName: string } }) => {
          const isSelected = d.properties.dbName === selectedSido
          return isSelected
            ? [59, 130, 246, 255] as [number, number, number, number]
            : [255, 255, 255, 100] as [number, number, number, number]
        },

        getLineWidth: 1000,
        lineWidthMinPixels: 1,

        onClick,
        onHover,

        updateTriggers: {
          getFillColor: [selectedSido, meta],
          getLineColor: [selectedSido],
          getElevation: [meta]
        }
      })
    ]
  }, [mergedGeoData, meta, selectedSido, onClick, onHover])

  if (loading && !geoData) {
    return (
      <div className="h-full bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">3D 지도 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900 rounded-xl overflow-hidden relative">
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 bg-gradient-to-b from-gray-900/90 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">전국 학생수 3D 지도</h2>
            <p className="text-xs text-gray-400">{year}년 {schoolLevel || '전체'} | 마우스 드래그로 회전</p>
          </div>
          {selectedSido && (
            <button
              onClick={() => setSelectedSido(null)}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs hover:bg-blue-500/30 transition-colors"
            >
              {selectedSido} 선택 해제
            </button>
          )}
        </div>
      </div>

      {/* 3D 지도 */}
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={{
          dragRotate: true,
          touchRotate: true,
          keyboard: true
        }}
        layers={layers}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>

      {/* 호버 툴팁 */}
      {hoverInfo && hoverInfo.data && (
        <div
          className="absolute pointer-events-none z-20 bg-gray-900/95 border border-white/20 rounded-lg px-4 py-3 shadow-xl"
          style={{
            left: hoverInfo.x + 10,
            top: hoverInfo.y + 10
          }}
        >
          <p className="font-semibold text-white text-lg mb-2">{hoverInfo.sido}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-300">
              <span className="text-gray-500">학생수:</span>{' '}
              <span className="font-medium">{hoverInfo.data.totalStudents.toLocaleString()}명</span>
            </p>
            <p className="text-gray-300">
              <span className="text-gray-500">학교수:</span>{' '}
              <span className="font-medium">{hoverInfo.data.schoolCount.toLocaleString()}개</span>
            </p>
            <div className="flex gap-4 mt-2 pt-2 border-t border-white/10">
              <p className="text-blue-400">
                <span className="text-gray-500">남:</span> {hoverInfo.data.maleStudents.toLocaleString()}
              </p>
              <p className="text-pink-400">
                <span className="text-gray-500">여:</span> {hoverInfo.data.femaleStudents.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="absolute bottom-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-white/10">
        <p className="text-xs text-gray-400 mb-2">학생수</p>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">적음</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(59, 130, 246)' }}></div>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(234, 179, 8)' }}></div>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(249, 115, 22)' }}></div>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
          </div>
          <span className="text-[10px] text-gray-500">많음</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">높이 = 학생수</p>
      </div>

      {/* 조작법 */}
      <div className="absolute bottom-4 right-4 z-10 text-[10px] text-gray-500">
        <p>🖱️ 드래그: 회전 | 스크롤: 줌 | 클릭: 선택</p>
      </div>
    </div>
  )
}
