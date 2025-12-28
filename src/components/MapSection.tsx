'use client'

import dynamic from 'next/dynamic'

// deck.gl과 MapLibre는 SSR에서 동작하지 않으므로 dynamic import
const Map3D = dynamic(() => import('./Map3D'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-900 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">3D 지도 로딩 중...</p>
      </div>
    </div>
  )
})

export default function MapSection() {
  return <Map3D />
}
