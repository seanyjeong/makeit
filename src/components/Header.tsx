'use client'

import { useFilterStore } from '@/lib/store'

export default function Header() {
  const { year } = useFilterStore()

  return (
    <header className="bg-gray-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">EduStats Korea</h1>
            <p className="text-xs text-gray-400">전국 학생수 통계 시각화</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <span className="text-xs text-gray-400">데이터 기준</span>
            <span className="text-sm font-medium text-white">{year}년</span>
          </div>

          <a
            href="https://kess.kedi.re.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            데이터 출처: KESS
          </a>
        </div>
      </div>
    </header>
  )
}
