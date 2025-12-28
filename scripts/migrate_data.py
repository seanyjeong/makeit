#!/usr/bin/env python3
"""
Excel → MySQL 데이터 마이그레이션 스크립트
2020-2025년 학생수 통계 데이터를 makeit DB로 이관
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import os
import glob
from datetime import datetime

# DB 설정
DB_CONFIG = {
    'host': 'localhost',
    'user': 'paca',
    'password': 'q141171616!',
    'database': 'makeit',
    'charset': 'utf8mb4'
}

# 엑셀 파일 경로
EXCEL_DIR = '/home/sean/makeit/db'

def get_connection():
    """MySQL 연결"""
    return mysql.connector.connect(**DB_CONFIG)

def extract_year(filename):
    """파일명에서 년도 추출"""
    import re
    match = re.search(r'(\d{4})년', filename)
    return int(match.group(1)) if match else None

def clean_value(val):
    """값 정제 (NaN, 빈문자열 처리)"""
    if pd.isna(val) or val == '':
        return None
    return str(val).strip()

def clean_int(val):
    """정수 정제"""
    if pd.isna(val) or val == '':
        return 0
    try:
        return int(float(val))
    except:
        return 0

def get_sheet_name(xl):
    """데이터 시트 이름 찾기"""
    for name in xl.sheet_names:
        # 상세 데이터 시트 찾기 (다양한 이름 대응)
        if 'data-set' in name.lower() or '학교별' in name:
            return name
    return xl.sheet_names[0]  # 첫 번째 시트

def get_header_row(df):
    """헤더 행 찾기 (조사기준일 컬럼 위치)"""
    for i in range(min(15, len(df))):
        row = df.iloc[i]
        if '조사기준일' in str(row.values):
            return i
    return 7  # 기본값

def migrate_file(filepath, conn):
    """단일 엑셀 파일 마이그레이션"""
    filename = os.path.basename(filepath)
    year = extract_year(filename)

    if not year:
        print(f"❌ 년도 추출 실패: {filename}")
        return 0

    print(f"\n📂 처리 중: {filename} ({year}년)")

    # 엑셀 파일 열기
    xl = pd.ExcelFile(filepath)
    sheet_name = get_sheet_name(xl)
    print(f"   시트: {sheet_name}")

    # 헤더 행 찾기
    df_raw = pd.read_excel(filepath, sheet_name=sheet_name, header=None, nrows=15)
    header_row = get_header_row(df_raw)
    print(f"   헤더 행: {header_row}")

    # 데이터 읽기
    df = pd.read_excel(filepath, sheet_name=sheet_name, header=header_row)

    # 컬럼명 정규화 (공백/개행 제거)
    df.columns = [str(c).strip().replace('\n', '') for c in df.columns]

    print(f"   컬럼: {len(df.columns)}개, 행: {len(df):,}개")

    cursor = conn.cursor()

    # 기존 해당 년도 데이터 삭제
    cursor.execute("DELETE FROM student_data_raw WHERE year = %s", (year,))
    print(f"   기존 {year}년 데이터 삭제")

    # 컬럼 매핑 (다양한 컬럼명 대응)
    col_map = {
        'sido': ['시도'],
        'sigungu': ['행정구역'],
        'edu_office': ['교육(지원)청', '교육청', '교육지원청'],
        'school_name': ['학교명'],
        'school_level': ['학제 대분류', '학제대분류'],
        'high_school_type': ['고등학교 유형', '고등학교유형'],
        'establishment': ['설립'],
        'region_size': ['지역규모'],
        'grade': ['학년'],
        'class_name': ['반'],
        'class_count': ['학급수'],
        'students_total': ['학생수_계', '학생수'],
        'students_male': ['학생수_남'],
        'students_female': ['학생수_여']
    }

    def get_col(row, keys):
        for key in keys:
            if key in df.columns and pd.notna(row.get(key)):
                return row.get(key)
        return None

    # 배치 삽입
    insert_sql = """
        INSERT INTO student_data_raw
        (year, sido, sigungu, edu_office, school_name, school_level,
         high_school_type, establishment, region_size, grade, class_name,
         class_count, students_total, students_male, students_female)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    batch_size = 5000
    total_inserted = 0
    batch_data = []

    for idx, row in df.iterrows():
        sido = clean_value(get_col(row, col_map['sido']))
        if not sido:  # 시도가 없으면 스킵
            continue

        data = (
            year,
            sido,
            clean_value(get_col(row, col_map['sigungu'])),
            clean_value(get_col(row, col_map['edu_office'])),
            clean_value(get_col(row, col_map['school_name'])),
            clean_value(get_col(row, col_map['school_level'])),
            clean_value(get_col(row, col_map['high_school_type'])),
            clean_value(get_col(row, col_map['establishment'])),
            clean_value(get_col(row, col_map['region_size'])),
            clean_int(get_col(row, col_map['grade'])),
            clean_value(get_col(row, col_map['class_name'])),
            clean_int(get_col(row, col_map['class_count'])),
            clean_int(get_col(row, col_map['students_total'])),
            clean_int(get_col(row, col_map['students_male'])),
            clean_int(get_col(row, col_map['students_female']))
        )

        batch_data.append(data)

        if len(batch_data) >= batch_size:
            cursor.executemany(insert_sql, batch_data)
            conn.commit()
            total_inserted += len(batch_data)
            print(f"   진행: {total_inserted:,}행 삽입됨...")
            batch_data = []

    # 남은 데이터 삽입
    if batch_data:
        cursor.executemany(insert_sql, batch_data)
        conn.commit()
        total_inserted += len(batch_data)

    cursor.close()
    print(f"   ✅ 완료: {total_inserted:,}행 삽입")

    return total_inserted

def create_statistics_summary(conn):
    """집계 테이블 생성 (student_statistics)"""
    print("\n📊 집계 테이블 생성 중...")

    cursor = conn.cursor()

    # 기존 데이터 삭제
    cursor.execute("TRUNCATE TABLE student_statistics")

    # 집계 쿼리
    aggregate_sql = """
        INSERT INTO student_statistics
        (year, sido, sigungu, school_level, total_students, male_students,
         female_students, total_classes, school_count)
        SELECT
            year,
            sido,
            sigungu,
            school_level,
            SUM(students_total) as total_students,
            SUM(students_male) as male_students,
            SUM(students_female) as female_students,
            SUM(class_count) as total_classes,
            COUNT(DISTINCT school_name) as school_count
        FROM student_data_raw
        WHERE sido IS NOT NULL AND school_level IS NOT NULL
        GROUP BY year, sido, sigungu, school_level
    """

    cursor.execute(aggregate_sql)
    conn.commit()

    # 결과 확인
    cursor.execute("SELECT COUNT(*) FROM student_statistics")
    count = cursor.fetchone()[0]

    cursor.close()
    print(f"   ✅ 집계 완료: {count:,}개 레코드")

    return count

def verify_data(conn):
    """데이터 검증"""
    print("\n🔍 데이터 검증 중...")

    cursor = conn.cursor(dictionary=True)

    # 년도별 통계
    cursor.execute("""
        SELECT year, COUNT(*) as row_count, SUM(students_total) as total
        FROM student_data_raw
        GROUP BY year
        ORDER BY year
    """)

    print("\n   [원본 데이터 (student_data_raw)]")
    for row in cursor.fetchall():
        print(f"   {row['year']}년: {row['row_count']:,}행, 학생수 {row['total']:,}명")

    # 집계 테이블 확인
    cursor.execute("""
        SELECT year, SUM(total_students) as total, SUM(school_count) as schools
        FROM student_statistics
        GROUP BY year
        ORDER BY year
    """)

    print("\n   [집계 데이터 (student_statistics)]")
    for row in cursor.fetchall():
        print(f"   {row['year']}년: 학생수 {row['total']:,}명, 학교수 {row['schools']:,}개")

    cursor.close()

def main():
    """메인 실행"""
    print("=" * 60)
    print("📚 학생수 통계 데이터 마이그레이션")
    print(f"   시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 엑셀 파일 목록
    excel_files = sorted(glob.glob(os.path.join(EXCEL_DIR, '*.xlsx')))

    if not excel_files:
        print(f"❌ 엑셀 파일을 찾을 수 없습니다: {EXCEL_DIR}")
        return

    print(f"\n📁 발견된 파일: {len(excel_files)}개")
    for f in excel_files:
        print(f"   - {os.path.basename(f)}")

    # DB 연결
    try:
        conn = get_connection()
        print("\n✅ MySQL 연결 성공")

        total_rows = 0

        # 각 파일 마이그레이션
        for filepath in excel_files:
            rows = migrate_file(filepath, conn)
            total_rows += rows

        print(f"\n📊 총 {total_rows:,}행 마이그레이션 완료")

        # 집계 테이블 생성
        create_statistics_summary(conn)

        # 검증
        verify_data(conn)

        conn.close()

    except Error as e:
        print(f"❌ MySQL 오류: {e}")
        return

    print("\n" + "=" * 60)
    print(f"✅ 마이그레이션 완료!")
    print(f"   종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
