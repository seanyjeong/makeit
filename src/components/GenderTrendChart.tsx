'use client'

import { useFilterStore, useSelectedRegionStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import { fetchTrend, TrendData } from '@/lib/api'
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

export default function GenderTrendChart() {
  const { schoolLevel } = useFilterStore()
  const { selectedSido, selectedSigungu } = useSelectedRegionStore()
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchTrend(selectedSido || undefined, selectedSigungu || undefined, schoolLevel || undefined).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [selectedSido, selectedSigungu, schoolLevel])

  // 남녀 비율 계산
  const getGenderRatio = () => {
    if (data.length === 0) return { male: 50, female: 50 }
    const latest = data[data.length - 1]
    const total = latest.maleStudents + latest.femaleStudents
    if (total === 0) return { male: 50, female: 50 }
    return {
      male: Math.round((latest.maleStudents / total) * 100),
      female: Math.round((latest.femaleStudents / total) * 100)
    }
  }

  const ratio = getGenderRatio()

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-[400px]">
        <div className="h-6 bg-white/10 rounded w-32 mb-4 animate-pulse"></div>
        <div className="h-[300px] bg-white/10 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden h-[400px] flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">남녀 학생수 추이</h2>
            <p className="text-xs text-gray-400">
              {selectedSigungu
                ? `${selectedSido} ${selectedSigungu}`
                : selectedSido || '전국'} · {schoolLevel || '전체'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-400">남 {ratio.male}%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="text-xs text-gray-400">여 {ratio.female}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <Legend
              formatter={(value) => (value === 'maleStudents' ? '남학생' : '여학생')}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="maleStudents"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="femaleStudents"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ fill: '#ec4899', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
