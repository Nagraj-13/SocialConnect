// app/discover/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";
import { Search, UserPlus, UserMinus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserListSkeleton } from "../loaders/skeletonLoaders"; // 👈 import skeleton

type User = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
};

const DiscoverPage = () => {
  const { user: currentUser, authFetch } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authFetch("/api/users/discover");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setFollowingUsers(new Set(data.followingIds));
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      setLoadingFollow((prev) => new Set(prev).add(userId));
      const isCurrentlyFollowing = followingUsers.has(userId);
      const endpoint = isCurrentlyFollowing
        ? "/api/users/unfollow"
        : "/api/users/follow";

      const response = await authFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const newFollowingUsers = new Set(followingUsers);
        if (isCurrentlyFollowing) {
          newFollowingUsers.delete(userId);
          toast.success("Unfollowed successfully");
        } else {
          newFollowingUsers.add(userId);
          toast.success("Following successfully");
        }
        setFollowingUsers(newFollowingUsers);

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  _count: {
                    ...user._count,
                    followers:
                      user._count.followers + (isCurrentlyFollowing ? -1 : 1),
                  },
                }
              : user
          )
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Action failed");
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      toast.error("Action failed");
    } finally {
      setLoadingFollow((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.bio?.toLowerCase().includes(searchLower)
    );
  });

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.firstName || user.lastName || "Unknown User";
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Discover People</h1>
          <p className="text-muted-foreground text-sm">
            Find and connect with others in the community
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <UserListSkeleton key={i} />
              ))
            : filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="flex flex-col justify-between hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl || ""} />
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <h3 className="font-medium truncate">
                        {getDisplayName(user)}
                      </h3>
                      {user.username && (
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="text-sm text-muted-foreground pb-4">
                    {user.bio ? (
                      <p className="line-clamp-2">{user.bio}</p>
                    ) : (
                      <p className="italic text-xs text-muted-foreground/70">
                        No bio provided
                      </p>
                    )}
                  </CardContent>

                  {user.id !== currentUser?.id && (
                    <CardFooter>
                      <Button
                        onClick={() => handleFollow(user.id)}
                        disabled={loadingFollow.has(user.id)}
                        className="w-full"
                        variant={
                          followingUsers.has(user.id) ? "outline" : "default"
                        }
                      >
                        {loadingFollow.has(user.id) ? (
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : followingUsers.has(user.id) ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-1" /> Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" /> Follow
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
        </div>

        {/* No results */}
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
