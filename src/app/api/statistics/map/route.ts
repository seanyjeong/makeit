import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 시도별 중심 좌표 (대략적인 위치)
const SIDO_COORDINATES: Record<string, [number, number]> = {
  '서울': [126.9780, 37.5665],
  '부산': [129.0756, 35.1796],
  '대구': [128.6014, 35.8714],
  '인천': [126.7052, 37.4563],
  '광주': [126.8526, 35.1595],
  '대전': [127.3845, 36.3504],
  '울산': [129.3114, 35.5384],
  '세종': [127.2894, 36.4800],
  '경기': [127.0095, 37.2752],
  '강원': [128.2093, 37.8228],
  '충북': [127.9303, 36.6357],
  '충남': [126.8428, 36.5184],
  '전북': [127.1088, 35.8200],
  '전남': [126.9910, 34.8679],
  '경북': [128.5055, 36.4919],
  '경남': [128.6921, 35.4606],
  '제주': [126.5312, 33.4996]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const schoolLevel = searchParams.get('schoolLevel')

    // 기본값: 최신 년도
    const targetYear = year ? parseInt(year) : 2025

    // 필터 조건
    const where: Record<string, unknown> = { year: targetYear }
    if (schoolLevel) where.schoolLevel = schoolLevel

    // 시도별 집계
    const bySido = await prisma.studentStatistics.groupBy({
      by: ['sido'],
      where,
      _sum: {
        totalStudents: true,
        maleStudents: true,
        femaleStudents: true,
        schoolCount: true
      }
    })

    // 지도 데이터 포맷
    const mapData = bySido.map(item => ({
      sido: item.sido,
      totalStudents: item._sum.totalStudents || 0,
      maleStudents: item._sum.maleStudents || 0,
      femaleStudents: item._sum.femaleStudents || 0,
      schoolCount: item._sum.schoolCount || 0,
      coordinates: SIDO_COORDINATES[item.sido] || [127.0, 36.5]
    }))

    // 최대값 (색상 스케일용)
    const maxStudents = Math.max(...mapData.map(d => d.totalStudents))
    const minStudents = Math.min(...mapData.map(d => d.totalStudents))

    return NextResponse.json({
      success: true,
      year: targetYear,
      schoolLevel: schoolLevel || 'all',
      meta: {
        maxStudents,
        minStudents,
        totalRegions: mapData.length
      },
      data: mapData
    })
  } catch (error) {
    console.error('Map API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
