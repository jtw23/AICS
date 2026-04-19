import type { Notification } from '../hooks/useNotifications';

interface Props {
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export default function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-gray-800">알림</span>
          <button onClick={onMarkAllRead} className="text-xs text-indigo-600 hover:underline">
            모두 읽음
          </button>
        </div>
        <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {notifications.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-400 text-sm">알림이 없습니다.</li>
          )}
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.read ? 'opacity-50' : ''}`}
            >
              <p className="text-sm text-gray-800">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.created_at * 1000).toLocaleString('ko-KR')}
              </p>
              {!n.read && <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mt-1" />}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
