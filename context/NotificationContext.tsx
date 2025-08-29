"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/authContext";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bell } from "lucide-react";

type NotificationContextType = {
  unreadCount: number;
  hasNewNotification: boolean;
  clearNewNotification: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, authFetch } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCount();
    setupRealtimeSubscription();
  }, [user?.id]);

  const fetchUnreadCount = async () => {
    try {
      const response = await authFetch("/api/notifications/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          setUnreadCount(prev => prev + 1);
          setHasNewNotification(true);
          
          // Show toast notification
          toast.custom((t) => (
            <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-3 shadow-lg">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">New notification</p>
                <p className="text-xs text-muted-foreground">You have a new notification</p>
              </div>
            </div>
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const clearNewNotification = () => {
    setHasNewNotification(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        hasNewNotification,
        clearNewNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
