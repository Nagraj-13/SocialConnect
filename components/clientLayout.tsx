"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/SidePannel";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // check if the route starts with /auth
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    // No sidebar or header for /auth routes
    return <main className="flex-1 p-4">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
