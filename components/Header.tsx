"use client";

import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/userContext";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
const {profile} = useUser();
  const displayName =
    user?.user_metadata?.firstName ||
    user?.user_metadata?.username ||
    "User";

  return (
    <header className="w-full border-b bg-background px-6 py-3 flex items-center justify-between">
      {/* Logo (only on mobile) */}
      <div
        className="md:hidden flex items-center gap-2 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <div className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center font-bold">
          SC
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 px-6 max-w-xl hidden sm:block">
        <Input placeholder="Search posts, users..." className="w-full" />
      </div>

      {/* Profile Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage
              src={profile?.avatar_url || user?.user_metadata?.avatar_url || ""}
              alt={displayName}
            />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600">
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
