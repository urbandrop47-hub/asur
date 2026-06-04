"use client";

import { create } from "zustand";
import { api } from "../lib/api";

export type Notification = {
  _id: string;
  type: "order_update" | "back_in_stock" | "drop_launch" | "promo" | "loyalty";
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

type ListResponse = { data: { notifications: Notification[]; unreadCount: number } };

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  drawerOpen: boolean;
  loading: boolean;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  drawerOpen: false,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const json = await api.get<ListResponse>("/api/v1/notifications/");
      set({
        notifications: json.data.notifications,
        unreadCount: json.data.unreadCount
      });
    } catch {
      // silent — polling is best-effort
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id: string) => {
    const prev = get().notifications;
    const wasUnread = prev.some((n) => n._id === id && !n.read);
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - (wasUnread ? 1 : 0))
    }));
    try {
      await api.patch(`/api/v1/notifications/${id}/read`, {});
    } catch {
      // revert optimistic update
      get().fetch();
    }
  },

  markAllRead: async () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0
    }));
    try {
      await api.patch("/api/v1/notifications/read-all", {});
    } catch {
      get().fetch();
    }
  },

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false })
}));
