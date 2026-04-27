import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface UserRow { id: number; email: string; name: string; role: string; }
interface Employee { id: number; name: string; department: '개발팀' | '기획팀' | '디자인팀'; }
interface ClientAssignment {
  department: '개발팀' | '기획팀' | '디자인팀';
  employee_id: number;
  employee_name: string;
}
interface ClientRow {
  id: number; client_code: string; name: string; created_at: number;
  assignments: ClientAssignment[];
}

const DEPARTMENTS = ['개발팀', '기획팀', '디자인팀'] as const;

const DEPT_CFG: Record<string, { dot: string; tagBg: string; tagText: string }> = {
  개발팀:   { dot: 'bg-blue-500',    tagBg: 'bg-blue-50',    tagText: 'text-blue-600' },
  기획팀:   { dot: 'bg-emerald-500', tagBg: 'bg-emerald-50', tagText: 'text-emerald-600' },
  디자인팀: { dot: 'bg-pink-500',    tagBg: 'bg-pink-50',    tagText: 'text-pink-600' },
};

type Tab = 'notion' | 'clients' | 'employees';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'notion',     icon: 'api', label: 'API 연동' },
  { key: 'clients',    icon: 'domain',                   label: '고객사 관리' },
  { key: 'employees',  icon: 'group',                    label: '직원 관리' },
];

const card = "bg-surface-container-lowest rounded-xl border border-surface-variant shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)]";
const inputCls = "w-full border border-outline-variant rounded-lg font-body-md text-body-md bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline";
const btnPrimary = "px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-full font-label-md text-label-md disabled:opacity-50 transition-colors shadow-sm";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('notion');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <h1 className="text-h1 font-h1 text-on-surface mb-2">설정</h1>
        <p className="text-body-lg text-on-surface-variant">API 연동, 고객사, 직원 정보를 관리합니다.</p>
      </div>

      {/* 탭 */}
      <div className="flex bg-surface-container rounded-xl" style={{ gap: '0.25rem', padding: '0.25rem' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center rounded-lg font-label-md text-label-md transition-all ${
              tab === t.key
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            style={{ paddingTop: '0.625rem', paddingBottom: '0.625rem', gap: '0.5rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'notion'    && <NotionTab />}
      {tab === 'clients'   && <ClientsTab />}
      {tab === 'employees' && <EmployeesTab />}
    </div>
  );
}

function NotionTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <NotionSection />
      <OpenRouterSection />
    </div>
  );
}

function NotionSection() {
  const [dbId, setDbId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ notion_database_id: string }>('/settings/notion').then((r) => setDbId(r.data.notion_database_id));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/notion', { notion_database_id: dbId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const connected = dbId.trim().length > 0;

  return (
    <div className={card} style={{ padding: '1.5rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3 className="font-semibold text-on-surface" style={{ fontSize: '1.125rem' }}>Notion 데이터베이스 연동</h3>
          <p className="text-body-md text-on-surface-variant" style={{ marginTop: '0.25rem' }}>
            문의 처리 시 AI 분류 결과와 답변 초안을 Notion 데이터베이스에 자동 등록합니다.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-sm text-label-sm border ${
          connected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-surface-container text-on-surface-variant border-outline-variant'
        }`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-outline-variant'}`} />
          {connected ? '연결됨' : '미연결'}
        </span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label className="block font-label-sm text-label-sm text-on-surface-variant" style={{ marginBottom: '0.25rem' }}>
          Notion Database ID
        </label>
        <p className="text-on-surface-variant" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
          Notion에서 데이터베이스 열기 → 우상단 <strong>···</strong> → <strong>링크 복사</strong> → URL의 32자리 16진수 ID 붙여넣기
          <br/>
          <span className="font-mono text-outline" style={{ fontSize: '0.6875rem' }}>예) https://notion.so/workspace/<u>a1b2c3d4e5f6...</u>?v=...</span>
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={dbId}
            onChange={(e) => setDbId(e.target.value)}
            placeholder="a1b2c3d4e5f67890abcdef1234567890"
            className={inputCls}
            style={{ paddingTop: '0.625rem', paddingBottom: '0.625rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-shrink-0 rounded-full font-label-md text-label-md transition-all shadow-sm ${
              saved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-primary hover:bg-primary-container text-on-primary'
            } disabled:opacity-50`}
            style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
          >
            {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
          </button>
        </div>
      </div>

      <div className="bg-surface-container rounded-lg" style={{ padding: '1rem' }}>
        <p className="font-label-sm text-label-sm text-on-surface-variant" style={{ marginBottom: '0.5rem' }}>Notion DB 속성 매핑</p>
        <div className="flex flex-wrap" style={{ gap: '0.5rem' }}>
          {[
            ['작업 이름', 'title'],
            ['업체명', 'rich_text'],
            ['분류', 'select → AI 카테고리'],
            ['상태', 'status → 시작 전'],
            ['우선순위', 'select'],
            ['설명', 'rich_text → AI 요약'],
          ].map(([prop, type]) => (
            <span key={prop} className="inline-flex items-center gap-1 bg-surface-container-high rounded text-on-surface-variant"
              style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.25rem', paddingBottom: '0.25rem', fontSize: '0.75rem' }}>
              <strong className="text-on-surface">{prop}</strong>
              <span className="text-outline">→ {type}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpenRouterSection() {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModel, setNewModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    api.get<{ models: string[] }>('/settings/openrouter')
      .then((r) => setModels(r.data.models))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (models.length === 0) return;
    setSaving(true); setSaveError('');
    try {
      await api.put('/settings/openrouter', { models });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally { setSaving(false); }
  };

  const handleAdd = () => {
    const trimmed = newModel.trim();
    if (!trimmed || models.includes(trimmed)) return;
    setModels([...models, trimmed]);
    setNewModel('');
  };

  const handleDelete = (idx: number) => {
    setModels(models.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...models];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setModels(next);
  };

  const moveDown = (idx: number) => {
    if (idx === models.length - 1) return;
    const next = [...models];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setModels(next);
  };

  return (
    <div className={card} style={{ padding: '1.5rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3 className="font-semibold text-on-surface" style={{ fontSize: '1.125rem' }}>OpenRouter 모델 설정</h3>
          <p className="text-body-md text-on-surface-variant" style={{ marginTop: '0.25rem' }}>
            AI 분류·초안 생성에 사용할 모델 목록입니다. 위에서부터 순서대로 시도하며 오류 시 다음 모델로 폴백합니다.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading || models.length === 0}
          className={`flex-shrink-0 rounded-full font-label-md text-label-md transition-all shadow-sm ${
            saved
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-primary hover:bg-primary-container text-on-primary'
          } disabled:opacity-50`}
          style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
        >
          {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
        </button>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 bg-error-container border border-error/20 rounded-lg text-on-error-container"
          style={{ padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
          <span className="material-symbols-outlined text-error" style={{ fontSize: 16 }}>error</span>
          {saveError}
        </div>
      )}

      {/* 모델 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: '1.5rem 0' }}>
            <svg className="animate-spin w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
            </svg>
          </div>
        ) : models.length === 0 ? (
          <p className="text-outline text-body-md text-center" style={{ padding: '1.5rem 0' }}>모델이 없습니다.</p>
        ) : null}
        {!loading && models.map((m, idx) => {
          const isFree = m.endsWith(':free');
          return (
            <div key={idx} className="flex items-center gap-3 bg-surface-container-low rounded-lg"
              style={{ padding: '0.625rem 0.875rem' }}>
              <span className="text-on-surface-variant font-mono font-bold" style={{ fontSize: '0.75rem', minWidth: '1.25rem' }}>
                {idx + 1}
              </span>
              <span className="flex-1 font-mono text-on-surface" style={{ fontSize: '0.8125rem' }}>{m}</span>
              <span className={`rounded-full font-label-sm text-label-sm ${
                isFree ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`} style={{ padding: '0.125rem 0.5rem', fontSize: '0.6875rem' }}>
                {isFree ? '무료' : '유료'}
              </span>
              <div className="flex items-center" style={{ gap: '0.125rem' }}>
                <button onClick={() => moveUp(idx)} disabled={idx === 0}
                  className="text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors rounded"
                  style={{ padding: '0.125rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>keyboard_arrow_up</span>
                </button>
                <button onClick={() => moveDown(idx)} disabled={idx === models.length - 1}
                  className="text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors rounded"
                  style={{ padding: '0.125rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>keyboard_arrow_down</span>
                </button>
                <button onClick={() => handleDelete(idx)}
                  className="text-outline-variant hover:text-error transition-colors rounded"
                  style={{ padding: '0.125rem', marginLeft: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 모델 추가 */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newModel}
          onChange={(e) => setNewModel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="provider/model-name:free"
          className={inputCls}
          style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
        />
        <button
          onClick={handleAdd}
          disabled={!newModel.trim()}
          className="flex-shrink-0 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant rounded-lg transition-all disabled:opacity-40 flex items-center"
          style={{ paddingLeft: '1rem', paddingRight: '1rem', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          추가
        </button>
      </div>
    </div>
  );
}

function ClientsTab() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const load = () => api.get<{ items: ClientRow[] }>('/settings/clients').then((r) => setClients(r.data.items));

  useEffect(() => {
    load();
    api.get<{ items: Employee[] }>('/settings/employees').then((r) => setEmployees(r.data.items));
  }, []);

  const empByDept = (dept: string) => employees.filter((e) => e.department === dept);

  const handleAdd = async () => {
    if (!newCode.trim() || !newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/settings/clients', { client_code: newCode.trim(), name: newName.trim() });
      setNewCode(''); setNewName(''); setShowAddForm(false); load();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error ?? '추가 실패');
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/settings/clients/${id}`); load();
  };

  const handleAssign = async (clientId: number, department: string, employeeId: number | null) => {
    setSavingId(clientId);
    try { await api.put(`/settings/clients/${clientId}/assignment`, { employee_id: employeeId, department }); load(); }
    finally { setSavingId(null); }
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_code.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const assigned = clients.filter((c) => c.assignments.length > 0).length;

  const initials = (name: string) => name.replace(/[()（）\s]/g, '').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 헤더 카드 */}
      <div className={card} style={{ padding: '1.5rem' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between" style={{ gap: '1rem' }}>
          <div>
            <h2 className="font-semibold text-on-surface" style={{ fontSize: '1.25rem' }}>고객사 관리</h2>
            <p className="text-body-md text-on-surface-variant" style={{ marginTop: '0.25rem' }}>고객사별 팀 담당자(개발팀·기획팀·디자인팀)를 관리합니다.</p>
          </div>
          <div className="flex items-center" style={{ gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined text-outline" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="업체명 또는 코드 검색..."
                className="border border-slate-200 rounded-lg bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '2.25rem', paddingRight: '1rem', fontSize: '0.875rem', width: '16rem' }}
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-md flex items-center shadow-sm transition-all"
              style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', gap: '0.375rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>person_add</span>
              고객사 추가
            </button>
          </div>
        </div>

        {/* 인라인 추가 폼 */}
        {showAddForm && (
          <div className="border-t border-surface-variant" style={{ marginTop: '1.25rem', paddingTop: '1.25rem' }}>
            <div className="flex flex-wrap items-end" style={{ gap: '0.75rem' }}>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant" style={{ marginBottom: '0.375rem' }}>고객코드</label>
                <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="C062"
                  className="border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  style={{ width: '7rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
              </div>
              <div style={{ flex: 1, minWidth: '10rem' }}>
                <label className="block font-label-sm text-label-sm text-on-surface-variant" style={{ marginBottom: '0.375rem' }}>업체명</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="신규 고객사명"
                  className="w-full border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
              </div>
              <button onClick={handleAdd} disabled={adding || !newCode.trim() || !newName.trim()}
                className="bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-md flex items-center shadow-sm transition-all disabled:opacity-50"
                style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', gap: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                {adding ? '추가 중...' : '추가'}
              </button>
              <button onClick={() => setShowAddForm(false)}
                className="border border-outline-variant bg-white text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg font-label-md flex items-center transition-all"
                style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', gap: '0.375rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 통계 바 */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1rem' }}>
        {[
          { icon: 'corporate_fare', color: 'bg-indigo-50 text-indigo-600', label: '전체 고객사', value: clients.length },
          { icon: 'verified',       color: 'bg-emerald-50 text-emerald-600', label: '담당자 배정',  value: assigned },
          { icon: 'person_off',     color: 'bg-amber-50 text-amber-600',   label: '미배정',       value: clients.length - assigned },
        ].map(({ icon, color, label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm flex items-center" style={{ padding: '1.25rem', gap: '1rem' }}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
              <p className="text-caption text-on-surface-variant">{label}</p>
              <p className="font-h3 text-h3 text-on-surface">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 테이블 카드 */}
      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-100 flex items-center justify-between" style={{ padding: '1rem 1.5rem' }}>
          <div className="flex items-center" style={{ gap: '1rem' }}>
            <h3 className="font-semibold text-on-surface" style={{ fontSize: '1.125rem' }}>고객사 목록</h3>
            <span className="bg-secondary-container text-on-secondary-container rounded-full font-label-sm" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
              {filtered.length}개
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-slate-200">
                {['고객코드', '업체명', '개발팀', '기획팀', '디자인팀', ''].map((h, i) => (
                  <th key={i} className="font-label-sm text-on-surface-variant uppercase tracking-wider"
                    style={{ padding: '0.875rem 1.5rem', fontSize: '0.6875rem', whiteSpace: 'nowrap' }}>
                    {h && i >= 2 && i <= 4
                      ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${['bg-blue-50 text-blue-700','bg-emerald-50 text-emerald-700','bg-pink-50 text-pink-700'][i-2]}`}
                          style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{h}</span>
                      : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((c) => (
                <tr key={c.id} className="hover:bg-surface-bright transition-colors group">
                  <td className="font-mono text-on-surface-variant font-semibold" style={{ padding: '1rem 1.5rem', fontSize: '0.75rem' }}>{c.client_code}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div className="flex items-center" style={{ gap: '0.75rem' }}>
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500 flex-shrink-0" style={{ fontSize: '0.625rem' }}>
                        {initials(c.name)}
                      </div>
                      <span className="font-label-md text-on-surface">{c.name}</span>
                    </div>
                  </td>
                  {(['개발팀', '기획팀', '디자인팀'] as const).map((dept) => {
                    const cur = c.assignments.find((a) => a.department === dept);
                    return (
                      <td key={dept} style={{ padding: '0.75rem 1rem', width: '9rem' }}>
                        <div style={{ position: 'relative' }}>
                          <select
                            value={cur?.employee_id ?? ''}
                            onChange={(e) => handleAssign(c.id, dept, e.target.value ? Number(e.target.value) : null)}
                            disabled={savingId === c.id}
                            className="w-full appearance-none bg-surface border border-outline-variant rounded text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                            style={{ padding: '0.375rem 1.75rem 0.375rem 0.625rem', fontSize: '0.8125rem' }}
                          >
                            <option value="">미배정</option>
                            {empByDept(dept).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                          <span className="material-symbols-outlined text-outline pointer-events-none" style={{ position: 'absolute', right: '0.375rem', top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>unfold_more</span>
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: '1rem 1.5rem', width: '3rem', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(c.id)} className="text-outline-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100" title="삭제">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="text-center text-outline text-body-md" style={{ padding: '3rem' }}>검색 결과가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="bg-surface-container-low border-t border-slate-200 flex items-center justify-between" style={{ padding: '0.875rem 1.5rem' }}>
          <p className="text-caption text-on-surface-variant">
            {filtered.length > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} / 전체 ${filtered.length}개` : '0개'}
          </p>
          {totalPages > 1 && (() => {
            const getPageNums = (): (number | '...')[] => {
              if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
              if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
              if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
              return [1, '...', page - 1, page, page + 1, '...', totalPages];
            };
            return (
              <div className="flex items-center" style={{ gap: '0.25rem' }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 bg-white border border-outline-variant rounded-lg text-outline hover:text-primary disabled:opacity-40 transition-all">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                </button>
                {getPageNums().map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="text-on-surface-variant" style={{ padding: '0 0.25rem', fontSize: '0.875rem' }}>...</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)}
                      className={`font-bold rounded-lg transition-all ${p === page ? 'bg-primary text-on-primary' : 'bg-white border border-outline-variant text-on-surface hover:border-primary'}`}
                      style={{ width: '2.25rem', height: '2.25rem', fontSize: '0.75rem' }}>
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 bg-white border border-outline-variant rounded-lg text-outline hover:text-primary disabled:opacity-40 transition-all">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState<string>('개발팀');
  const [adding, setAdding] = useState(false);

  const load = () => api.get<{ items: Employee[] }>('/settings/employees').then((r) => setEmployees(r.data.items));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try { await api.post('/settings/employees', { name: newName.trim(), department: newDept }); setNewName(''); load(); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/settings/employees/${id}`); load();
  };

  const byDept = DEPARTMENTS.map((dept) => ({ dept, members: employees.filter((e) => e.department === dept) }));
  const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #14b8a6, #3b82f6)',
    'linear-gradient(135deg, #ef4444, #f97316)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #0ea5e9, #6366f1)',
    'linear-gradient(135deg, #22c55e, #14b8a6)',
  ];
  const avatarGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 헤더 + 추가 폼 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 className="font-semibold text-on-surface" style={{ fontSize: '1.25rem' }}>직원 관리</h2>
          <p className="text-body-md text-on-surface-variant" style={{ marginTop: '0.25rem' }}>부서별 직원 현황 및 조직 구성을 관리합니다.</p>
        </div>
        <div className="flex flex-wrap items-end" style={{ gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: '10rem' }}>
            <label className="block text-on-surface-variant" style={{ marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}>이름</label>
            <input
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="홍길동"
              className="w-full border border-outline-variant rounded-lg bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label className="block text-on-surface-variant" style={{ marginBottom: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}>부서</label>
            <select
              value={newDept} onChange={(e) => setNewDept(e.target.value)}
              className="border border-outline-variant rounded-lg bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            >
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button
            onClick={handleAdd} disabled={adding || !newName.trim()}
            className="bg-primary hover:bg-primary-container text-on-primary rounded-lg flex items-center shadow-sm transition-all disabled:opacity-50"
            style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>person_add</span>
            {adding ? '추가 중...' : '직원 추가'}
          </button>
        </div>
      </div>

      {/* 부서별 3컬럼 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
        {byDept.map(({ dept, members }) => {
          const cfg = DEPT_CFG[dept];
          return (
            <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* 컬럼 헤더 */}
              <div className="flex items-center" style={{ gap: '0.5rem', paddingLeft: '0.25rem' }}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <h3 className="font-semibold text-on-surface" style={{ fontSize: '1.125rem' }}>{dept}</h3>
                <span className="bg-slate-200 text-slate-600 font-bold rounded" style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem' }}>
                  {String(members.length).padStart(2, '0')}
                </span>
              </div>

              {/* 직원 카드 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {members.map((e) => (
                  <div key={e.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group" style={{ padding: '1rem' }}>
                    <div className="flex items-start" style={{ gap: '0.75rem' }}>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                        style={{ background: avatarGradient(e.name) }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}>person</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-label-md text-on-surface group-hover:text-primary transition-colors truncate">{e.name}</h4>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="text-outline-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="삭제" style={{ marginLeft: '0.5rem' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                          </button>
                        </div>
                        <p className="text-on-surface-variant" style={{ marginTop: '0.125rem', marginBottom: '0.5rem', fontSize: '0.75rem' }}>{dept}</p>
                        <span className={`inline-block font-semibold rounded ${cfg.tagBg} ${cfg.tagText}`} style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                          {dept}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          );
        })}
      </div>

      {/* 통계 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: '1.5rem' }}>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm" style={{ padding: '1.5rem' }}>
          <p className="text-slate-500 font-medium uppercase tracking-wider" style={{ marginBottom: '0.5rem', fontSize: '0.6875rem' }}>전체 직원</p>
          <div className="flex items-end justify-between">
            <span className="text-primary font-bold" style={{ fontSize: '2rem', lineHeight: 1 }}>{employees.length}</span>
            <span className="text-emerald-500 font-bold flex items-center" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', gap: '0.125rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>groups</span>명
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full" style={{ height: '0.25rem', marginTop: '1rem' }}>
            <div className="bg-primary rounded-full" style={{ height: '0.25rem', width: employees.length > 0 ? '100%' : '0%' }} />
          </div>
        </div>
        {byDept.map(({ dept, members }) => {
          const cfg = DEPT_CFG[dept];
          const ratio = employees.length > 0 ? (members.length / employees.length) * 100 : 0;
          return (
            <div key={dept} className="bg-white rounded-xl border border-slate-100 shadow-sm" style={{ padding: '1.5rem' }}>
              <p className="text-slate-500 font-medium uppercase tracking-wider" style={{ marginBottom: '0.5rem', fontSize: '0.6875rem' }}>{dept}</p>
              <div className="flex items-end justify-between">
                <span className="font-bold text-secondary" style={{ fontSize: '2rem', lineHeight: 1 }}>{members.length}</span>
                <span className="text-slate-400 font-bold" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>{ratio.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full" style={{ height: '0.25rem', marginTop: '1rem' }}>
                <div className={`${cfg.dot} rounded-full`} style={{ height: '0.25rem', width: `${ratio}%` }} />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
