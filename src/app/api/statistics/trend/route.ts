import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sido = searchParams.get('sido')
    const sigungu = searchParams.get('sigungu')
    const schoolLevel = searchParams.get('schoolLevel')

    // 필터 조건 구성
    const where: Record<string, unknown> = {}

    if (sido) where.sido = sido
    if (sigungu) where.sigungu = sigungu
    if (schoolLevel) where.schoolLevel = schoolLevel

    // 년도별 집계
    const trend = await prisma.studentStatistics.groupBy({
      by: ['year'],
      where,
      _sum: {
        totalStudents: true,
        maleStudents: true,
        femaleStudents: true,
        totalClasses: true,
        schoolCount: true
      },
      orderBy: {
        year: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      filters: { sido, sigungu, schoolLevel },
      data: trend.map(item => ({
        year: item.year,
        totalStudents: item._sum.totalStudents || 0,
        maleStudents: item._sum.maleStudents || 0,
        femaleStudents: item._sum.femaleStudents || 0,
        totalClasses: item._sum.totalClasses || 0,
        schoolCount: item._sum.schoolCount || 0
      }))
    })
  } catch (error) {
    console.error('Trend API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
