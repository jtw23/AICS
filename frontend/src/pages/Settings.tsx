import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Assignee {
  id: number;
  category: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  notion_database_id: string | null;
}

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
}

export default function SettingsPage() {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ items: Assignee[] }>('/settings/assignees').then((r) => setAssignees(r.data.items));
    api.get<{ items: UserRow[] }>('/settings/users').then((r) => setUsers(r.data.items));
  }, []);

  const handleSave = async (a: Assignee) => {
    setSaving(a.category);
    try {
      await api.put(`/settings/assignees/${a.category}`, {
        user_id: a.user_id,
        notion_database_id: a.notion_database_id || null,
      });
    } finally {
      setSaving(null);
    }
  };

  const updateField = (category: string, field: keyof Assignee, value: any) => {
    setAssignees((prev) =>
      prev.map((a) => (a.category === category ? { ...a, [field]: value } : a))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">설정</h2>
        <p className="text-sm text-gray-500 mt-1">카테고리별 담당자 및 Notion 데이터베이스를 설정합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">카테고리</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">담당자</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Notion 데이터베이스 ID</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignees.map((a) => (
              <tr key={a.category}>
                <td className="px-5 py-3 font-medium text-gray-800">{a.category}</td>
                <td className="px-5 py-3">
                  <select
                    value={a.user_id ?? ''}
                    onChange={(e) => updateField(a.category, 'user_id', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">미지정</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <input
                    type="text"
                    value={a.notion_database_id ?? ''}
                    onChange={(e) => updateField(a.category, 'notion_database_id', e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </td>
                <td className="px-5 py-3">
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
        <h3 className="text-base font-semibold text-gray-800 mb-3">사용자 목록</h3>
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>{u.role}</span>
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
