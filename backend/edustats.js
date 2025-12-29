/**
 * EduStats Korea Backend Server
 * Port: 3002
 * Database: MySQL (makeit)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3002;

// CORS
app.use(cors({
  origin: [
    'https://chejump.com',
    'http://localhost:3000',
    'http://localhost:3001',
    /\.vercel\.app$/
  ],
  credentials: true
}));

app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'paca',
  password: process.env.DB_PASSWORD || 'q141171616!',
  database: process.env.DB_NAME || 'makeit',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'edustats' });
});

// GET /regions - 시도/시군구 목록
app.get('/regions', async (req, res) => {
  try {
    const [sidos] = await pool.query(
      'SELECT DISTINCT sido FROM student_statistics ORDER BY sido'
    );

    const [sigungus] = await pool.query(
      'SELECT DISTINCT sido, sigungu FROM student_statistics WHERE sigungu IS NOT NULL ORDER BY sido, sigungu'
    );

    // 시군구를 시도별로 그룹화
    const sigunguBySido = {};
    sigungus.forEach(row => {
      if (!sigunguBySido[row.sido]) {
        sigunguBySido[row.sido] = [];
      }
      if (row.sigungu) {
        sigunguBySido[row.sido].push(row.sigungu);
      }
    });

    res.json({
      sidos: sidos.map(r => r.sido),
      sigungus: sigunguBySido
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

// GET /statistics - 통계 데이터 조회
app.get('/statistics', async (req, res) => {
  try {
    const { year, sido, sigungu, schoolLevel, page = 1, limit = 100 } = req.query;

    let query = 'SELECT * FROM student_statistics WHERE 1=1';
    const params = [];

    if (year) {
      query += ' AND year = ?';
      params.push(parseInt(year));
    }
    if (sido) {
      query += ' AND sido = ?';
      params.push(sido);
    }
    if (sigungu) {
      query += ' AND sigungu = ?';
      params.push(sigungu);
    }
    if (schoolLevel) {
      query += ' AND school_level = ?';
      params.push(schoolLevel);
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY year DESC, sido, sigungu LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /statistics/summary - 요약 통계
app.get('/statistics/summary', async (req, res) => {
  try {
    const { year = 2025, sido, sigungu, schoolLevel } = req.query;

    // WHERE 조건 구성
    let whereClause = 'WHERE year = ?';
    const params = [parseInt(year)];

    if (sido) {
      whereClause += ' AND sido = ?';
      params.push(sido);
    }
    if (sigungu) {
      whereClause += ' AND sigungu = ?';
      params.push(sigungu);
    }
    if (schoolLevel) {
      whereClause += ' AND school_level = ?';
      params.push(schoolLevel);
    }

    // 전체 통계
    const [totalResult] = await pool.query(`
      SELECT
        SUM(total_students) as students,
        SUM(male_students) as maleStudents,
        SUM(female_students) as femaleStudents,
        SUM(total_classes) as classes,
        SUM(school_count) as schools
      FROM student_statistics
      ${whereClause}
    `, params);

    // 학제별 통계
    const [bySchoolLevel] = await pool.query(`
      SELECT
        school_level as schoolLevel,
        SUM(total_students) as students,
        SUM(school_count) as schools
      FROM student_statistics
      ${whereClause}
      GROUP BY school_level
      ORDER BY students DESC
    `, params);

    // 시도별 통계 (시도 필터가 없을 때만)
    let bySido = [];
    if (!sido) {
      const [sidoResult] = await pool.query(`
        SELECT
          sido,
          SUM(total_students) as students,
          SUM(school_count) as schools
        FROM student_statistics
        ${whereClause}
        GROUP BY sido
        ORDER BY students DESC
      `, params);
      bySido = sidoResult;
    }

    // 연도 목록
    const [years] = await pool.query(
      'SELECT DISTINCT year FROM student_statistics ORDER BY year DESC'
    );

    res.json({
      success: true,
      year: parseInt(year),
      sido: sido || null,
      sigungu: sigungu || null,
      data: {
        total: totalResult[0],
        bySchoolLevel,
        bySido
      },
      years: years.map(y => y.year)
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /statistics/trend - 년도별 추이
app.get('/statistics/trend', async (req, res) => {
  try {
    const { sido, sigungu, schoolLevel } = req.query;

    let query = `
      SELECT
        year,
        SUM(total_students) as totalStudents,
        SUM(male_students) as maleStudents,
        SUM(female_students) as femaleStudents,
        SUM(school_count) as schoolCount
      FROM student_statistics
      WHERE 1=1
    `;
    const params = [];

    if (sido) {
      query += ' AND sido = ?';
      params.push(sido);
    }
    if (sigungu) {
      query += ' AND sigungu = ?';
      params.push(sigungu);
    }
    if (schoolLevel) {
      query += ' AND school_level = ?';
      params.push(schoolLevel);
    }

    query += ' GROUP BY year ORDER BY year ASC';

    const [rows] = await pool.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching trend:', error);
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

// GET /statistics/map - 지도용 시도별 데이터
app.get('/statistics/map', async (req, res) => {
  try {
    const { year = 2025, schoolLevel } = req.query;

    let query = `
      SELECT
        sido,
        SUM(total_students) as totalStudents,
        SUM(male_students) as maleStudents,
        SUM(female_students) as femaleStudents,
        SUM(school_count) as schoolCount
      FROM student_statistics
      WHERE year = ?
    `;
    const params = [parseInt(year)];

    if (schoolLevel) {
      query += ' AND school_level = ?';
      params.push(schoolLevel);
    }

    query += ' GROUP BY sido ORDER BY totalStudents DESC';

    const [rows] = await pool.query(query, params);

    // min/max 계산
    const students = rows.map(r => r.totalStudents);
    const maxStudents = Math.max(...students);
    const minStudents = Math.min(...students);

    res.json({
      data: rows,
      meta: { maxStudents, minStudents }
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

// GET /schools - 학교 목록 (필터 적용)
app.get('/schools', async (req, res) => {
  try {
    const { year = 2025, sido, sigungu, schoolLevel, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT DISTINCT
        school_name as schoolName,
        sido,
        sigungu,
        school_level as schoolLevel,
        SUM(students_total) as totalStudents,
        SUM(students_male) as maleStudents,
        SUM(students_female) as femaleStudents,
        SUM(class_count) as totalClasses
      FROM student_data_raw
      WHERE year = ?
    `;
    const params = [parseInt(year)];

    if (sido) {
      query += ' AND sido = ?';
      params.push(sido);
    }
    if (sigungu) {
      query += ' AND sigungu = ?';
      params.push(sigungu);
    }
    if (schoolLevel) {
      query += ' AND school_level = ?';
      params.push(schoolLevel);
    }

    query += ' GROUP BY school_name, sido, sigungu, school_level ORDER BY totalStudents DESC';

    // Count total
    const countQuery = `SELECT COUNT(DISTINCT school_name) as total FROM student_data_raw WHERE year = ?` +
      (sido ? ' AND sido = ?' : '') +
      (sigungu ? ' AND sigungu = ?' : '') +
      (schoolLevel ? ' AND school_level = ?' : '');
    const countParams = [parseInt(year)];
    if (sido) countParams.push(sido);
    if (sigungu) countParams.push(sigungu);
    if (schoolLevel) countParams.push(schoolLevel);

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// GET /schools/:name/detail - 학교 상세 (학년별 데이터)
app.get('/schools/:name/detail', async (req, res) => {
  try {
    const { name } = req.params;
    const { year = 2025 } = req.query;

    const [rows] = await pool.query(`
      SELECT
        grade as \`grade\`,
        SUM(class_count) as classCount,
        SUM(students_total) as totalStudents,
        SUM(students_male) as maleStudents,
        SUM(students_female) as femaleStudents
      FROM student_data_raw
      WHERE school_name = ? AND year = ?
      GROUP BY grade
      ORDER BY grade
    `, [decodeURIComponent(name), parseInt(year)]);

    // 학교 기본 정보
    const [info] = await pool.query(`
      SELECT DISTINCT
        school_name as schoolName,
        sido,
        sigungu,
        school_level as schoolLevel
      FROM student_data_raw
      WHERE school_name = ? AND year = ?
      LIMIT 1
    `, [decodeURIComponent(name), parseInt(year)]);

    res.json({
      success: true,
      school: info[0] || null,
      grades: rows
    });
  } catch (error) {
    console.error('Error fetching school detail:', error);
    res.status(500).json({ error: 'Failed to fetch school detail' });
  }
});

// GET /statistics/compare - 지역 그룹별 비교 데이터
app.get('/statistics/compare', async (req, res) => {
  try {
    const { groups, schoolLevel } = req.query;

    if (!groups) {
      return res.status(400).json({ error: 'Groups parameter required' });
    }

    // groups는 JSON 문자열로 받음: [["서울","경기"],["부산","대전","대구"]]
    const parsedGroups = JSON.parse(groups);

    const results = await Promise.all(parsedGroups.map(async (regionList, index) => {
      if (!Array.isArray(regionList) || regionList.length === 0) {
        return { groupIndex: index, data: [] };
      }

      const placeholders = regionList.map(() => '?').join(',');
      let query = `
        SELECT
          year,
          SUM(total_students) as totalStudents,
          SUM(male_students) as maleStudents,
          SUM(female_students) as femaleStudents,
          SUM(school_count) as schoolCount
        FROM student_statistics
        WHERE sido IN (${placeholders})
      `;
      const params = [...regionList];

      if (schoolLevel) {
        query += ' AND school_level = ?';
        params.push(schoolLevel);
      }

      query += ' GROUP BY year ORDER BY year ASC';

      const [rows] = await pool.query(query, params);
      return { groupIndex: index, regions: regionList, data: rows };
    }));

    res.json(results);
  } catch (error) {
    console.error('Error fetching compare data:', error);
    res.status(500).json({ error: 'Failed to fetch compare data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎓 EduStats Backend running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'makeit'}@${process.env.DB_HOST || 'localhost'}`);
});
