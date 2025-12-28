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
  Area,
  ComposedChart
} from 'recharts'

export default function TrendChart() {
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

  // 변화율 계산
  const getChangeRate = (): string => {
    if (data.length < 2) return '0'
    const first = data[0].totalStudents
    const last = data[data.length - 1].totalStudents
    const rate = ((last - first) / first) * 100
    return rate.toFixed(1)
  }

  const changeRate = getChangeRate()
  const isDecreasing = parseFloat(changeRate) < 0

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
            <h2 className="text-white font-semibold">
              {selectedSigungu
                ? `${selectedSido} ${selectedSigungu} 학생수 추이`
                : selectedSido
                  ? `${selectedSido} 학생수 추이`
                  : '전국 학생수 추이'}
            </h2>
            <p className="text-xs text-gray-400">2020-2025년 {schoolLevel || '전체'}</p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isDecreasing ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {isDecreasing ? '▼' : '▲'} {Math.abs(parseFloat(changeRate))}%
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="flex-1 p-4">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                formatter={(value) => [typeof value === 'number' ? value.toLocaleString() + '명' : value, '학생수']}
              />
              <Area
                type="monotone"
                dataKey="totalStudents"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorStudents)"
              />
              <Line
                type="monotone"
                dataKey="totalStudents"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
