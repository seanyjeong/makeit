import Header from '@/components/Header'
import FilterPanel from '@/components/FilterPanel'
import SummaryCards from '@/components/SummaryCards'
import TrendChart from '@/components/TrendChart'
import GenderTrendChart from '@/components/GenderTrendChart'
import RegionCompare from '@/components/RegionCompare'
import SchoolRanking from '@/components/SchoolRanking'
import SchoolTable from '@/components/SchoolTable'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {/* 필터 패널 (상단 고정) */}
        <section className="mb-6">
          <FilterPanel />
        </section>

        {/* 요약 카드 */}
        <section className="mb-6">
          <SummaryCards />
        </section>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 학생수 추이 */}
          <section>
            <TrendChart />
          </section>

          {/* 남녀 추이 */}
          <section>
            <GenderTrendChart />
          </section>
        </div>

        {/* 지역 비교 */}
        <section className="mb-6">
          <RegionCompare />
        </section>

        {/* 학교 랭킹 + 테이블 */}
        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
          {/* 학교 랭킹 */}
          <section>
            <SchoolRanking />
          </section>

          {/* 학교 목록 테이블 */}
          <section>
            <SchoolTable />
          </section>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-white/10 mt-12 py-6">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                학생수 통계 · 2020-2025년 전국 초·중·고 교육통계
              </p>
              <p className="text-xs text-gray-600 mt-1">
                데이터 출처: 한국교육개발원 교육통계서비스 (KESS)
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500">
                produced & designed by <span className="text-blue-400">정으뜸</span>
              </p>
              <p className="text-[10px] text-red-400/60 mt-1">
                ⓒ All rights reserved. 무단복제 및 재배포 금지
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
