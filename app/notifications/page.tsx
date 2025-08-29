// app/notifications/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Image,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LoadingSkeleton } from "../loaders/skeletonLoaders";

type Notification = {
  id: string;
  type: "FOLLOW" | "LIKE" | "COMMENT" | "POST";
  message: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  post?: {
    id: string;
    content: string;
    imageUrl: string | null;
  } | null;
};

const NotificationsPage = () => {
  const { user: currentUser, authFetch } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!currentUser?.id) return;

    fetchNotifications();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [currentUser?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await authFetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        toast.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUser?.id) return;

    const notificationsChannel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        (payload) => {
          fetchNotifications();
          const notif = payload.new as Notification;
          toast(
            `${notif.sender?.username || "Someone"} ${notif.message}`,
            {
              description: new Date(notif.createdAt).toLocaleTimeString(),
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === payload.new.id
                ? { ...notif, isRead: payload.new.is_read }
                : notif
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await authFetch(
        `/api/notifications/${notificationId}/read`,
        { method: "PATCH" }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const response = await authFetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
        toast.success("All notifications marked as read");
      } else {
        toast.error("Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getDisplayName = (user: Notification["sender"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.firstName || user.lastName || "Unknown User";
  };

  const getInitials = (user: Notification["sender"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "FOLLOW":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "LIKE":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "COMMENT":
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case "POST":
        return <Image className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;



  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Card className="mb-4 border-muted">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="h-6 w-6 text-primary" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">Notifications</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Stay updated with your latest activity
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  disabled={markingAllRead}
                  className="gap-2"
                >
                  {markingAllRead ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Notifications List */}
        <ScrollArea className="h-[62vh] pr-2">
          {notifications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No notifications yet
                </h3>
                <p className="text-muted-foreground text-sm text-center max-w-sm">
                  When people interact with your posts or follow you, you'll see
                  notifications here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, i) => (
                <React.Fragment key={notification.id}>
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
                      !notification.isRead
                        ? "border-l-4 border-l-primary bg-muted/20"
                        : "border border-muted"
                    }`}
                    onClick={() =>
                      !notification.isRead && markAsRead(notification.id)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage
                            src={notification.sender.avatarUrl || undefined}
                          />
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(notification.sender)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">
                                  {getDisplayName(notification.sender)}
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  {notification.message}
                                </span>
                              </p>

                              {/* Post preview */}
                              {notification.post && (
                                <div className="mt-2 p-2 bg-muted rounded-md">
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.post.content}
                                  </p>
                                  {notification.post.imageUrl && (
                                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                      <Image className="h-3 w-3" />
                                      <span>Image attached</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              {!notification.isRead ? (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              ) : (
                                <Check className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {i < notifications.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default NotificationsPage;
