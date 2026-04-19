import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';

export interface Notification {
  id: number;
  inquiry_id: number;
  channel: string;
  message: string;
  read: number;
  created_at: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ items: Notification[] }>('/notify');
      setNotifications(res.data.items);
      setUnreadCount(res.data.items.filter((n) => !n.read).length);
    } catch {
      // 인증 전 상태 등 무시
    }
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    fetchNotifications();

    const token = localStorage.getItem('token');
    const es = new EventSource(`/api/notify/stream?token=${token}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_inquiry') {
        fetchNotifications();
      }
    };

    return () => {
      es.close();
    };
  }, [fetchNotifications]);

  const markRead = async (id: number) => {
    await api.patch(`/notify/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await api.patch('/notify/read-all');
    fetchNotifications();
  };

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications };
}
