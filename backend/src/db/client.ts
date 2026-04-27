import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'aics.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const { mkdirSync } = require('fs');
    mkdirSync(join(process.cwd(), 'data'), { recursive: true });
    db = new Database(DB_PATH);
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);

    // 구 컬럼 마이그레이션
    try { db.exec('ALTER TABLE assignees ADD COLUMN notion_database_id TEXT'); } catch (_) {}
    try { db.exec('ALTER TABLE assignees DROP COLUMN discord_webhook'); } catch (_) {}
    try { db.exec('ALTER TABLE assignees ADD COLUMN notion_user_id TEXT'); } catch (_) {}
    try { db.exec('ALTER TABLE assignees ADD COLUMN department TEXT'); } catch (_) {}

    // inquiries에 client_id 추가
    try { db.exec('ALTER TABLE inquiries ADD COLUMN client_id INTEGER REFERENCES clients(id)'); } catch (_) {}

    // client_assignments: UNIQUE(client_id) → UNIQUE(client_id, department) 마이그레이션
    try {
      const cols = db.prepare('PRAGMA table_info(client_assignments)').all() as { name: string }[];
      if (!cols.find((c) => c.name === 'department')) {
        db.transaction(() => {
          db.exec(`CREATE TABLE client_assignments_v2 (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id  INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            department TEXT NOT NULL CHECK(department IN ('개발팀','기획팀','디자인팀')),
            UNIQUE(client_id, department),
            FOREIGN KEY (client_id)   REFERENCES clients(id)   ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
          )`);
          db.exec(`INSERT OR IGNORE INTO client_assignments_v2 (client_id, employee_id, department)
            SELECT ca.client_id, ca.employee_id, e.department
            FROM client_assignments ca JOIN employees e ON e.id = ca.employee_id`);
          db.exec(`DROP TABLE client_assignments`);
          db.exec(`ALTER TABLE client_assignments_v2 RENAME TO client_assignments`);
        })();
      }
    } catch (_) {}

    // 구 카테고리 삭제 → 새 카테고리로 교체
    db.exec(`DELETE FROM assignees WHERE category IN ('결제','배송','환불','계정')`);
    const insertCat = db.prepare('INSERT OR IGNORE INTO assignees (category) VALUES (?)');
    for (const cat of ['계약','견적','개발','유지보수','장애','기술지원','기타']) {
      insertCat.run(cat);
    }

    // 직원 시드
    const empCount = (db.prepare('SELECT COUNT(*) as c FROM employees').get() as { c: number }).c;
    if (empCount === 0) {
      const ins = db.prepare('INSERT INTO employees (name, department) VALUES (?, ?)');
      db.transaction(() => {
        for (const name of ['이상진','김희철','조태웅','구범석','박종길','한수현','윤종구','김주희','윤원태']) {
          ins.run(name, '개발팀');
        }
        for (const name of ['한승현','박지혜','최명환','주민성','박지훈']) {
          ins.run(name, '기획팀');
        }
        for (const name of ['김찬기','최서희','윤주희','류정미']) {
          ins.run(name, '디자인팀');
        }
      })();
    }

    // 고객사 시드
    const clientCount = (db.prepare('SELECT COUNT(*) as c FROM clients').get() as { c: number }).c;
    if (clientCount === 0) {
      const insClient = db.prepare('INSERT INTO clients (client_code, name) VALUES (?, ?)');
      const insAssign = db.prepare(`
        INSERT OR IGNORE INTO client_assignments (client_id, employee_id, department)
        SELECT ?, id, department FROM employees WHERE name = ?
      `);

      const clientData: [string, string, string][] = [
        ['C001', '부산시 정비사업', '이상진'],
        ['C002', '학교지원서비스(BSSS)', '이상진'],
        ['C003', 'LS일렉트릭', '이상진'],
        ['C004', '오토닉스', '이상진'],
        ['C005', '부산방과후(6월 종료)', '김희철'],
        ['C006', '충북인사', '조태웅'],
        ['C007', '울산방과후', '구범석'],
        ['C008', 'BIC(인디게임 페스티벌)', '박종길'],
        ['C009', '네이버', '한수현'],
        ['C010', '국립부산과학관', '이상진'],
        ['C011', '도시정보재생종합시스템', '이상진'],
        ['C012', '다모아', '이상진'],
        ['C013', '창원대 공동실험실습관', '이상진'],
        ['C014', '지산학', '조태웅'],
        ['C015', '장애인일자리정보망(JAVA)', '이상진'],
        ['C016', '감염병관리지원단(JAVA)', '이상진'],
        ['C017', '병원간호사회', '이상진'],
        ['C018', '제주진단시스템', '김희철'],
        ['C019', '부산교육공무직채용시스템', '이상진'],
        ['C020', '경제진흥원', '이상진'],
        ['C021', '창고이음(2월 중 해지)', '구범석'],
        ['C022', '캡스톤', '김주희'],
        ['C023', 'BTIS', '윤종구'],
        ['C024', '기장도시관리공단', '이상진'],
        ['C025', '부산시예산편성', '김희철'],
        ['C026', '한성대 기숙사', '한수현'],
        ['C027', 'LH', '윤종구'],
        ['C028', '창원시 정비사업', '김희철'],
        ['C029', '경기도 정비사업', '김희철'],
        ['C030', '메디투어 신규 2025', '윤원태'],
        ['C031', '문화재단', '윤종구'],
        ['C032', '한세대', '한수현'],
        ['C033', '오캠핑', '윤원태'],
        ['C034', '부산인사시스템', '이상진'],
        ['C035', '금융박물관로드', '이상진'],
        ['C036', '성인지 웹진', '이상진'],
        ['C037', '대학생 골목상권 마케터즈 플랫폼', '이상진'],
        ['C038', '부경대 구글앱스', '이상진'],
        ['C039', '선도기업', '이상진'],
        ['C040', '유니칸', '이상진'],
        ['C041', '파맥스', '이상진'],
        ['C042', '부경대 대표 및 CMS', '이상진'],
        ['C043', '삼성 바이오로직스 파트너 포탈', '이상진'],
        ['C044', '삼영E&C', '이상진'],
        ['C045', '부경대 수과대 본원 + CMS 9개학과', '이상진'],
        ['C046', '부산도시가스', '이상진'],
        ['C047', '바다TV', '이상진'],
        ['C048', '부산자원순환', '이상진'],
        ['C049', '연세대 어도비', '이상진'],
        ['C050', '부산대 부동산학과 원우앱', '한수현'],
        ['C051', 'UST 기숙사', '이상진'],
        ['C052', '서울시목적사업', '이상진'],
        ['C053', '오리엔탈 검사개발', '이상진'],
        ['C054', '부산시 공공보건의료지원단', '이상진'],
        ['C055', '부산시교육청 법무행정', '이상진'],
        ['C056', '서울의료원 2025', '한수현'],
        ['C057', '울산 강사매칭', '구범석'],
        ['C058', '남성초등학교', '이상진'],
        ['C059', '디지털커머스(소담스퀘어)', '이상진'],
        ['C060', '함바까보까(부산경제진흥원)', '이상진'],
        ['C061', '경제진흥원 부산지식산업센터 nifc', '이상진'],
      ];

      db.transaction(() => {
        for (const [code, name, empName] of clientData) {
          const result = insClient.run(code, name);
          insAssign.run(result.lastInsertRowid, empName);
        }
      })();
    }

    // 기획팀·디자인팀 랜덤 배정 (최초 1회)
    const planDesignSeeded = db
      .prepare("SELECT value FROM app_settings WHERE key = 'plan_design_assigned'")
      .get();
    if (!planDesignSeeded) {
      const allClients = db.prepare('SELECT id FROM clients').all() as { id: number }[];
      const kihoekEmps = db
        .prepare("SELECT id FROM employees WHERE department = '기획팀'")
        .all() as { id: number }[];
      const designEmps = db
        .prepare("SELECT id FROM employees WHERE department = '디자인팀'")
        .all() as { id: number }[];

      if (kihoekEmps.length > 0 && designEmps.length > 0) {
        const ins = db.prepare(
          'INSERT OR IGNORE INTO client_assignments (client_id, employee_id, department) VALUES (?, ?, ?)'
        );
        db.transaction(() => {
          for (const { id: clientId } of allClients) {
            ins.run(clientId, kihoekEmps[Math.floor(Math.random() * kihoekEmps.length)].id, '기획팀');
            ins.run(clientId, designEmps[Math.floor(Math.random() * designEmps.length)].id, '디자인팀');
          }
        })();
        db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('plan_design_assigned', '1')").run();
      }
    }
  }
  return db;
}
