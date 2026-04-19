import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../lib/auth';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';
import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItem = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        location.pathname === to
          ? 'bg-indigo-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-indigo-600 text-lg">AICS</span>
            <nav className="flex gap-1">
              {navItem('/', '문의 처리')}
              {navItem('/history', '히스토리')}
              {user?.role === 'admin' && navItem('/settings', '설정')}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* 알림 버튼 */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <NotificationPanel
                  notifications={notifications}
                  onMarkRead={markRead}
                  onMarkAllRead={markAllRead}
                  onClose={() => setShowNotif(false)}
                />
              )}
            </div>

            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-700 px-3 py-1 rounded border border-gray-200 hover:border-gray-400 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
