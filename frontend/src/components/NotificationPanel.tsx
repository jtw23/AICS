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
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-variant bg-surface-container-low">
          <span className="font-label-md text-label-md text-on-surface">알림</span>
          <button onClick={onMarkAllRead} className="font-caption text-caption text-primary-container hover:text-primary font-semibold">
            모두 읽음
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto divide-y divide-surface-variant">
          {notifications.length === 0 && (
            <li className="px-4 py-10 text-center text-outline text-body-md">알림이 없습니다.</li>
          )}
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`px-4 py-3 cursor-pointer hover:bg-surface-container-low transition-colors ${n.read ? 'opacity-50' : ''}`}
            >
              <div className="flex gap-3">
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary-container mt-1.5 flex-shrink-0" />}
                <div className={n.read ? 'pl-5' : ''}>
                  <p className="text-body-md text-on-surface">{n.message}</p>
                  <p className="text-caption text-outline mt-1">
                    {new Date(n.created_at * 1000).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
