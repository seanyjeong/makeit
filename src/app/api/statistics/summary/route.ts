import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')

    // 기본값: 최신 년도
    const targetYear = year ? parseInt(year) : 2025

    // 전체 요약 통계
    const summary = await prisma.studentStatistics.aggregate({
      where: { year: targetYear },
      _sum: {
        totalStudents: true,
        maleStudents: true,
        femaleStudents: true,
        totalClasses: true,
        schoolCount: true
      }
    })

    // 학제별 통계
    const bySchoolLevel = await prisma.studentStatistics.groupBy({
      by: ['schoolLevel'],
      where: { year: targetYear },
      _sum: {
        totalStudents: true,
        schoolCount: true
      }
    })

    // 시도별 통계
    const bySido = await prisma.studentStatistics.groupBy({
      by: ['sido'],
      where: { year: targetYear },
      _sum: {
        totalStudents: true,
        schoolCount: true
      },
      orderBy: {
        _sum: {
          totalStudents: 'desc'
        }
      }
    })

    return NextResponse.json({
      success: true,
      year: targetYear,
      data: {
        total: {
          students: summary._sum.totalStudents || 0,
          maleStudents: summary._sum.maleStudents || 0,
          femaleStudents: summary._sum.femaleStudents || 0,
          classes: summary._sum.totalClasses || 0,
          schools: summary._sum.schoolCount || 0
        },
        bySchoolLevel: bySchoolLevel.map(item => ({
          schoolLevel: item.schoolLevel,
          students: item._sum.totalStudents || 0,
          schools: item._sum.schoolCount || 0
        })),
        bySido: bySido.map(item => ({
          sido: item.sido,
          students: item._sum.totalStudents || 0,
          schools: item._sum.schoolCount || 0
        }))
      }
    })
  } catch (error) {
    console.error('Summary API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
