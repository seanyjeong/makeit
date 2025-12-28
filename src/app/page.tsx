import Header from '@/components/Header'
import FilterPanel from '@/components/FilterPanel'
import SummaryCards from '@/components/SummaryCards'
import MapSection from '@/components/MapSection'
import TrendChart from '@/components/TrendChart'
import SchoolTable from '@/components/SchoolTable'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />

      <main className="max-w-[1800px] mx-auto px-4 py-6">
        {/* 상단: 요약 카드 */}
        <section className="mb-6">
          <SummaryCards />
        </section>

        {/* 상단 영역: 필터 + 지도 + 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-6 mb-6">
          {/* 왼쪽: 필터 패널 */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <FilterPanel />
          </aside>

          {/* 가운데: 지도 */}
          <section className="min-h-[400px] lg:min-h-[500px]">
            <MapSection />
          </section>

          {/* 오른쪽: 추이 차트 */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <TrendChart />
          </aside>
        </div>

        {/* 하단: 학교 목록 테이블 */}
        <section>
          <SchoolTable />
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-white/10 mt-12 py-6">
        <div className="max-w-[1800px] mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            데이터 출처: 한국교육개발원 교육통계서비스 (KESS) | 2020-2025년 교육통계
          </p>
        </div>
      </footer>
    </div>
  )
}
