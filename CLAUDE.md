# EduStats Korea - 학생수 통계 지도 시각화

## 프로젝트 개요
2020-2025년 전국 초중고 학생수 데이터를 3D 지도로 시각화하는 통계 대시보드

## 기술 스택
- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **3D 지도**: deck.gl + MapLibre GL (무료)
- **차트**: Recharts
- **DB**: MySQL (makeit 스키마)
- **ORM**: Prisma

## DB 정보
- Host: localhost
- User: paca
- Database: makeit
- Tables: student_statistics, student_data_raw

## 주요 API 엔드포인트
- `GET /api/statistics` - 통계 데이터 조회
- `GET /api/statistics/summary` - 요약 통계
- `GET /api/statistics/trend` - 년도별 추이
- `GET /api/regions` - 시도/시군구 목록

## 개발 명령어
```bash
npm run dev      # 개발 서버 (포트 3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
```

## 배포
- Caddy 리버스 프록시로 구성 (paca/peak와 동일)
- 도메인: TBD

## 데이터 소스
- 한국교육개발원 교육통계서비스 (KESS)
- https://kess.kedi.re.kr
