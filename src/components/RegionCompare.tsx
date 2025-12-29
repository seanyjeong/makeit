'use client'

import { useFilterStore, useRegionCompareStore, GROUP_COLORS } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchRegions, fetchCompareData, CompareGroupData } from '@/lib/api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'

export default function RegionCompare() {
  const { schoolLevel } = useFilterStore()
  const { groups, addGroup, removeGroup, addRegionToGroup, removeRegionFromGroup, clearGroups } = useRegionCompareStore()

  const [sidos, setSidos] = useState<string[]>([])
  const [compareData, setCompareData] = useState<CompareGroupData[]>([])
  const [loading, setLoading] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  // 시도 목록 로드
  useEffect(() => {
    fetchRegions().then(data => setSidos(data.sidos))
  }, [])

  // 그룹 변경 시 비교 데이터 로드
  useEffect(() => {
    const validGroups = groups.filter(g => g.regions.length > 0)
    if (validGroups.length < 2) {
      setCompareData([])
      return
    }

    setLoading(true)
    const groupRegions = validGroups.map(g => g.regions)
    fetchCompareData(groupRegions, schoolLevel || undefined).then(data => {
      setCompareData(data)
      setLoading(false)
    })
  }, [groups, schoolLevel])

  // 새 그룹 추가
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return
    const color = GROUP_COLORS[groups.length % GROUP_COLORS.length]
    addGroup(newGroupName.trim(), color)
    setNewGroupName('')
  }

  // 차트 데이터 변환
  const getChartData = () => {
    if (compareData.length === 0) return []

    const years = new Set<number>()
    compareData.forEach(g => g.data.forEach(d => years.add(d.year)))

    return Array.from(years).sort().map(year => {
      const point: Record<string, number | string> = { year }
      compareData.forEach((g, i) => {
        const yearData = g.data.find(d => d.year === year)
        const group = groups.filter(gr => gr.regions.length > 0)[i]
        if (group && yearData) {
          point[group.name] = yearData.totalStudents
        }
      })
      return point
    })
  }

  const chartData = getChartData()
  const validGroups = groups.filter(g => g.regions.length > 0)

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">지역 비교</h2>
            <p className="text-xs text-gray-400">여러 지역을 그룹으로 묶어 비교해보세요</p>
          </div>
          {groups.length > 0 && (
            <button
              onClick={clearGroups}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              전체 초기화
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* 그룹 추가 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
            placeholder="그룹명 (예: 수도권, 영남권)"
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddGroup}
            disabled={!newGroupName.trim() || groups.length >= 5}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            그룹 추가
          </button>
        </div>

        {/* 그룹 목록 */}
        {groups.length > 0 && (
          <div className="space-y-3 mb-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`p-3 rounded-lg border transition-all ${
                  selectedGroup === group.id
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-white text-sm font-medium">{group.name}</span>
                    <span className="text-xs text-gray-500">
                      ({group.regions.length}개 지역)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {selectedGroup === group.id ? '닫기' : '지역 추가'}
                    </button>
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="text-xs text-gray-400 hover:text-red-400"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* 선택된 지역들 */}
                <div className="flex flex-wrap gap-1">
                  {group.regions.map(sido => (
                    <span
                      key={sido}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: group.color + '30', color: group.color }}
                    >
                      {sido}
                      <button
                        onClick={() => removeRegionFromGroup(group.id, sido)}
                        className="hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {group.regions.length === 0 && (
                    <span className="text-xs text-gray-500">지역을 추가해주세요</span>
                  )}
                </div>

                {/* 지역 선택 드롭다운 */}
                {selectedGroup === group.id && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex flex-wrap gap-1">
                      {sidos
                        .filter(s => !group.regions.includes(s))
                        .map(sido => (
                          <button
                            key={sido}
                            onClick={() => addRegionToGroup(group.id, sido)}
                            className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded hover:bg-white/20 transition-colors"
                          >
                            + {sido}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 비교 차트 */}
        {validGroups.length >= 2 ? (
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-2">학생수 추이 비교</div>
            {loading ? (
              <div className="h-[250px] bg-white/5 rounded-lg animate-pulse" />
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="year"
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [
                        typeof value === 'number' ? value.toLocaleString() + '명' : value,
                        ''
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {validGroups.map((group) => (
                      <Line
                        key={group.id}
                        type="monotone"
                        dataKey={group.name}
                        stroke={group.color}
                        strokeWidth={2}
                        dot={{ fill: group.color, strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            {groups.length === 0 ? (
              '그룹을 추가하고 지역을 선택해보세요'
            ) : validGroups.length < 2 ? (
              '비교하려면 2개 이상의 그룹에 지역을 추가하세요'
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
