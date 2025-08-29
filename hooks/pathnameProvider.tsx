"use client";

import { usePathname } from "next/navigation";

export default function PathnameProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  console.log("Current Path:", pathname);

  return <>{children}</>;
}
