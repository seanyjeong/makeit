import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const sido = searchParams.get('sido')
    const sigungu = searchParams.get('sigungu')
    const schoolLevel = searchParams.get('schoolLevel')

    // 필터 조건 구성
    const where: Record<string, unknown> = {}

    if (year) where.year = parseInt(year)
    if (sido) where.sido = sido
    if (sigungu) where.sigungu = sigungu
    if (schoolLevel) where.schoolLevel = schoolLevel

    const data = await prisma.studentStatistics.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { sido: 'asc' },
        { sigungu: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      count: data.length,
      data
    })
  } catch (error) {
    console.error('Statistics API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
