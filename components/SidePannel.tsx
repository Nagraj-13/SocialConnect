"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, User, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/authContext"; 

const links = [
  { name: "Home", href: "/", icon: Home },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Discover", href: "/discover", icon: Search },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user: currentUser, authFetch } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count initially
  const fetchUnreadCount = async () => {
    try {
      const res = await authFetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  // Realtime updates
  useEffect(() => {
    if (!currentUser?.id) return;
    fetchUnreadCount();

    const channel = supabase
      .channel("notifications-sidebar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  return (
    <>
  
      <aside className="hidden md:flex w-60 border-r bg-background px-5 py-6 flex-col">
        {/* Logo */}
        <div
          className="flex items-center gap-2 mb-8 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div className="bg-primary text-primary-foreground w-9 h-9 rounded-lg flex items-center justify-center font-bold">
            SC
          </div>
          <span className="font-semibold text-lg text-foreground">
            SocialConnect
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {links.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;
            const isNotif = name === "Notifications";
            return (
              <Link
                key={name}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                {name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full border-t bg-background flex justify-around py-2 z-50">
        {links.map(({ name, href, icon: Icon }) => {
          const active = pathname === href;
          const isNotif = name === "Notifications";
          return (
            <Link
              key={name}
              href={href}
              className={cn(
                "flex flex-col items-center text-xs font-medium transition-colors relative",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 mb-0.5" />
                {isNotif && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              {name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
