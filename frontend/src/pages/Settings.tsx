import { useState, useEffect } from 'react';
import { api } from '../lib/api';

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface Assignee {
  id: number;
  category: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  notion_database_id: string | null;
  notion_user_id: string | null;
}

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface Employee {
  id: number;
  name: string;
  department: '개발팀' | '기획팀' | '디자인팀';
}

interface ClientRow {
  id: number;
  client_code: string;
  name: string;
  employee_id: number | null;
  employee_name: string | null;
  department: string | null;
}

const DEPARTMENTS = ['개발팀', '기획팀', '디자인팀'] as const;
const DEPT_COLORS: Record<string, string> = {
  개발팀: 'bg-indigo-100 text-indigo-700',
  기획팀: 'bg-green-100 text-green-700',
  디자인팀: 'bg-pink-100 text-pink-700',
};

type Tab = 'assignees' | 'clients' | 'employees';

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('assignees');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">설정</h2>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'assignees', label: '카테고리 담당자' },
          { key: 'clients',   label: '고객사 관리' },
          { key: 'employees', label: '직원 관리' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assignees' && <AssigneesTab />}
      {tab === 'clients'   && <ClientsTab />}
      {tab === 'employees' && <EmployeesTab />}
    </div>
  );
}

// ── 탭 1: 카테고리 담당자 ─────────────────────────────────────────────────────

function AssigneesTab() {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ items: Assignee[] }>('/settings/assignees').then((r) => setAssignees(r.data.items));
    api.get<{ items: UserRow[] }>('/settings/users').then((r) => setUsers(r.data.items));
  }, []);

  const updateField = (category: string, field: keyof Assignee, value: string | number | null) => {
    setAssignees((prev) =>
      prev.map((a) => (a.category === category ? { ...a, [field]: value } : a))
    );
  };

  const handleSave = async (a: Assignee) => {
    setSaving(a.category);
    try {
      await api.put(`/settings/assignees/${a.category}`, {
        user_id: a.user_id,
        notion_database_id: a.notion_database_id || null,
        notion_user_id: a.notion_user_id || null,
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">카테고리별 담당자(로그인 계정) 및 Notion 데이터베이스를 설정합니다.</p>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">카테고리</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">담당자 (시스템)</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Notion DB ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Notion 담당자 UUID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignees.map((a) => (
              <tr key={a.category}>
                <td className="px-4 py-3 font-medium text-gray-800">{a.category}</td>
                <td className="px-4 py-3">
                  <select
                    value={a.user_id ?? ''}
                    onChange={(e) =>
                      updateField(a.category, 'user_id', e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">미지정</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={a.notion_database_id ?? ''}
                    onChange={(e) => updateField(a.category, 'notion_database_id', e.target.value)}
                    placeholder="DB ID (32자)"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={a.notion_user_id ?? ''}
                    onChange={(e) => updateField(a.category, 'notion_user_id', e.target.value)}
                    placeholder="User UUID (담당자 자동 배정)"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleSave(a)}
                    disabled={saving === a.category}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {saving === a.category ? '저장 중...' : '저장'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 사용자 목록 */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">시스템 사용자</h3>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">이름</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">이메일</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">역할</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 text-gray-800">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 탭 2: 고객사 관리 ─────────────────────────────────────────────────────────

function ClientsTab() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = () => {
    api.get<{ items: ClientRow[] }>('/settings/clients').then((r) => setClients(r.data.items));
  };

  useEffect(() => {
    load();
    api.get<{ items: Employee[] }>('/settings/employees').then((r) => setEmployees(r.data.items));
  }, []);

  const devEmployees = employees.filter((e) => e.department === '개발팀');

  const handleAdd = async () => {
    if (!newCode.trim() || !newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/settings/clients', { client_code: newCode.trim(), name: newName.trim() });
      setNewCode('');
      setNewName('');
      load();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      alert(e.response?.data?.error ?? '추가 실패');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/settings/clients/${id}`);
    load();
  };

  const handleAssign = async (clientId: number, employeeId: number | null) => {
    setSavingId(clientId);
    try {
      await api.put(`/settings/clients/${clientId}/assignment`, { employee_id: employeeId });
      load();
    } finally {
      setSavingId(null);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 추가 폼 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">고객코드</label>
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="C062"
            className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex-1 min-w-40">
          <label className="block text-xs font-medium text-gray-600 mb-1">업체명</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="신규 고객사명"
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !newCode.trim() || !newName.trim()}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {adding ? '추가 중...' : '추가'}
        </button>
        <div className="w-full border-t border-gray-100 pt-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="업체명 또는 코드 검색..."
            className="w-full max-w-sm px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">코드</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">업체명</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-48">개발팀 담당자</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{c.client_code}</td>
                <td className="px-4 py-2.5 text-gray-800">{c.name}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={c.employee_id ?? ''}
                    onChange={(e) =>
                      handleAssign(c.id, e.target.value ? Number(e.target.value) : null)
                    }
                    disabled={savingId === c.id}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
                  >
                    <option value="">미배정</option>
                    {devEmployees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">총 {filtered.length}개 (전체 {clients.length}개)</p>
    </div>
  );
}

// ── 탭 3: 직원 관리 ───────────────────────────────────────────────────────────

function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState<string>('개발팀');
  const [adding, setAdding] = useState(false);

  const load = () => {
    api.get<{ items: Employee[] }>('/settings/employees').then((r) => setEmployees(r.data.items));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/settings/employees', { name: newName.trim(), department: newDept });
      setNewName('');
      load();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/settings/employees/${id}`);
    load();
  };

  const byDept = DEPARTMENTS.map((dept) => ({
    dept,
    members: employees.filter((e) => e.department === dept),
  }));

  return (
    <div className="space-y-4">
      {/* 추가 폼 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-32">
          <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="홍길동"
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">부서</label>
          <select
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {adding ? '추가 중...' : '추가'}
        </button>
      </div>

      {/* 부서별 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {byDept.map(({ dept, members }) => (
          <div key={dept} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className={`px-4 py-2.5 border-b border-gray-100 ${DEPT_COLORS[dept]}`}>
              <span className="font-semibold text-sm">{dept}</span>
              <span className="ml-2 text-xs opacity-70">{members.length}명</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {members.map((e) => (
                <li key={e.id} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-800">{e.name}</span>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    삭제
                  </button>
                </li>
              ))}
              {members.length === 0 && (
                <li className="px-4 py-4 text-center text-gray-400 text-xs">없음</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
