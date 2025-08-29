"use client";

import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";

export const NotificationBell: React.FC = () => {
  const { unreadCount, hasNewNotification, clearNewNotification } = useNotifications();
  const router = useRouter();

  const handleClick = () => {
    clearNewNotification();
    router.push('/notifications');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`relative transition-all duration-200 ${
        hasNewNotification ? 'animate-bounce' : ''
      }`}
    >
      <Bell className={`h-5 w-5 ${hasNewNotification ? 'text-primary' : ''}`} />
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};
