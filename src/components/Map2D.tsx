'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Map, Source, Layer, MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre'
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

// 역매핑
const SIDO_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SIDO_MAP).map(([k, v]) => [v, k])
)

// 시도별 중심 좌표
const SIDO_CENTERS: Record<string, [number, number]> = {
  '서울': [126.9780, 37.5665],
  '부산': [129.0756, 35.1796],
  '대구': [128.6014, 35.8714],
  '인천': [126.7052, 37.4563],
  '광주': [126.8526, 35.1595],
  '대전': [127.3845, 36.3504],
  '울산': [129.3114, 35.5384],
  '세종': [127.2894, 36.4800],
  '경기': [127.0093, 37.2636],
  '강원': [128.3115, 37.8603],
  '충북': [127.7000, 36.6357],
  '충남': [126.8000, 36.5184],
  '전북': [127.1530, 35.7175],
  '전남': [126.9910, 34.8679],
  '경북': [128.8889, 36.4919],
  '경남': [128.6922, 35.4606],
  '제주': [126.5312, 33.4996]
}

// 색상 계산 함수
function getColorExpression(minStudents: number, maxStudents: number) {
  const range = maxStudents - minStudents || 1
  const step1 = minStudents + range * 0.2
  const step2 = minStudents + range * 0.4
  const step3 = minStudents + range * 0.6
  const step4 = minStudents + range * 0.8

  return [
    'interpolate',
    ['linear'],
    ['get', 'totalStudents'],
    minStudents, '#3b82f6',  // blue
    step1, '#22c55e',        // green
    step2, '#eab308',        // yellow
    step3, '#f97316',        // orange
    step4, '#ef4444'         // red
  ]
}

// GeoJSON 데이터 타입
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSONData = any

export default function Map2D() {
  const mapRef = useRef<MapRef>(null)
  const { year, schoolLevel } = useFilterStore()
  const { selectedSido, setSelectedSido, setSelectedSigungu } = useSelectedRegionStore()

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features: geoData.features.map((feature: any) => {
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
  const onClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0]
      const dbName = feature.properties?.dbName
      if (dbName) {
        if (dbName === selectedSido) {
          // 같은 시도 다시 클릭하면 해제
          setSelectedSido(null)
          setSelectedSigungu(null)
          // 전국 뷰로 이동
          mapRef.current?.flyTo({
            center: [127.5, 36.0],
            zoom: 6.5,
            duration: 1000
          })
        } else {
          // 새로운 시도 선택
          setSelectedSido(dbName)
          setSelectedSigungu(null)
          // 해당 시도로 줌인
          const center = SIDO_CENTERS[dbName]
          if (center && mapRef.current) {
            mapRef.current.flyTo({
              center,
              zoom: 9,
              duration: 1000
            })
          }
        }
      }
    }
  }, [selectedSido, setSelectedSido, setSelectedSigungu])

  // 호버 핸들러
  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0]
      const dbName = feature.properties?.dbName
      if (dbName) {
        setHoverInfo({
          x: e.point.x,
          y: e.point.y,
          sido: dbName,
          data: statsMap[dbName] || null
        })
      }
    } else {
      setHoverInfo(null)
    }
  }, [statsMap])

  const onMouseLeave = useCallback(() => {
    setHoverInfo(null)
  }, [])

  // 전국보기 버튼
  const handleResetView = useCallback(() => {
    setSelectedSido(null)
    setSelectedSigungu(null)
    mapRef.current?.flyTo({
      center: [127.5, 36.0],
      zoom: 6.5,
      duration: 1000
    })
  }, [setSelectedSido, setSelectedSigungu])

  if (loading && !geoData) {
    return (
      <div className="h-full bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">지도 로딩 중...</p>
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
            <h2 className="text-white font-semibold">전국 학생수 지도</h2>
            <p className="text-xs text-gray-400">{year}년 {schoolLevel || '전체'} | 클릭하여 지역 선택</p>
          </div>
          {selectedSido && (
            <button
              onClick={handleResetView}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs hover:bg-blue-500/30 transition-colors"
            >
              전국 보기
            </button>
          )}
        </div>
      </div>

      {/* 2D 지도 */}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 127.5,
          latitude: 36.0,
          zoom: 6.5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={{
          version: 8,
          sources: {
            'vworld-base': {
              type: 'raster',
              tiles: [
                'https://api.vworld.kr/req/wmts/1.0.0/CEB52025-E065-364C-9DBA-44880E3B02B1/Base/{z}/{y}/{x}.png'
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'vworld-base-layer',
              type: 'raster',
              source: 'vworld-base',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        }}
        interactiveLayerIds={['sido-fill']}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        attributionControl={false}
      >
        {mergedGeoData && (
          <Source id="sido-data" type="geojson" data={mergedGeoData}>
            {/* 채우기 레이어 */}
            <Layer
              id="sido-fill"
              type="fill"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              paint={{
                'fill-color': [
                  'case',
                  ['==', ['get', 'dbName'], selectedSido || ''],
                  '#ffffff',
                  getColorExpression(meta.minStudents, meta.maxStudents)
                ],
                'fill-opacity': [
                  'case',
                  ['==', ['get', 'dbName'], selectedSido || ''],
                  0.9,
                  0.7
                ]
              } as any}
            />
            {/* 외곽선 레이어 */}
            <Layer
              id="sido-outline"
              type="line"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              paint={{
                'line-color': [
                  'case',
                  ['==', ['get', 'dbName'], selectedSido || ''],
                  '#3b82f6',
                  'rgba(255, 255, 255, 0.5)'
                ],
                'line-width': [
                  'case',
                  ['==', ['get', 'dbName'], selectedSido || ''],
                  3,
                  1
                ]
              } as any}
            />
            {/* 라벨 레이어 */}
            <Layer
              id="sido-label"
              type="symbol"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              layout={{
                'text-field': ['get', 'dbName'],
                'text-size': 11,
                'text-anchor': 'center',
                'text-allow-overlap': false
              } as any}
              paint={{
                'text-color': '#fff',
                'text-halo-color': '#000',
                'text-halo-width': 1.5
              }}
            />
          </Source>
        )}
      </Map>

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
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }}></div>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }}></div>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#eab308' }}></div>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#f97316' }}></div>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div>
          </div>
          <span className="text-[10px] text-gray-500">많음</span>
        </div>
      </div>

      {/* 선택된 시도 정보 */}
      {selectedSido && statsMap[selectedSido] && (
        <div className="absolute bottom-4 right-4 z-10 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-blue-500/30">
          <p className="text-xs text-blue-400 mb-1">선택: {selectedSido}</p>
          <p className="text-lg font-bold text-white">
            {statsMap[selectedSido].totalStudents.toLocaleString()}명
          </p>
          <p className="text-xs text-gray-400">
            {statsMap[selectedSido].schoolCount.toLocaleString()}개 학교
          </p>
        </div>
      )}
    </div>
  )
}
