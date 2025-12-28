import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sido = searchParams.get('sido')

    if (sido) {
      // 특정 시도의 시군구 목록
      const sigungus = await prisma.studentStatistics.findMany({
        where: { sido },
        select: { sigungu: true },
        distinct: ['sigungu'],
        orderBy: { sigungu: 'asc' }
      })

      return NextResponse.json({
        success: true,
        sido,
        data: sigungus
          .map(s => s.sigungu)
          .filter(Boolean)
          .sort()
      })
    }

    // 시도 목록
    const sidos = await prisma.studentStatistics.findMany({
      select: { sido: true },
      distinct: ['sido'],
      orderBy: { sido: 'asc' }
    })

    // 사용 가능한 년도 목록
    const years = await prisma.studentStatistics.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    })

    // 학제 목록
    const schoolLevels = await prisma.studentStatistics.findMany({
      select: { schoolLevel: true },
      distinct: ['schoolLevel']
    })

    return NextResponse.json({
      success: true,
      data: {
        sidos: sidos.map(s => s.sido),
        years: years.map(y => y.year),
        schoolLevels: schoolLevels.map(s => s.schoolLevel)
      }
    })
  } catch (error) {
    console.error('Regions API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
