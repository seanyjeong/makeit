'use client'

import { useFilterStore } from '@/lib/store'

export default function Header() {
  const { year } = useFilterStore()

  return (
    <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              학생수 통계
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              produced by <span className="text-blue-400">정으뜸</span> · design by <span className="text-purple-400">정으뜸</span>
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-gray-500">데이터 기준</span>
              <span className="text-sm font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded">{year}년</span>
            </div>
            <p className="text-[10px] text-red-400/70 mt-1">ⓒ 무단복제 및 재배포 금지</p>
          </div>
        </div>
      </div>
    </header>
  )
}
