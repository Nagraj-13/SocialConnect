// app/admin/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/authContext";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Trash,
  Edit,
  Check,
  X,
  Search as SearchIcon,
  UserMinus,
  UserPlus,
} from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role: "USER" | "ADMIN";
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { posts?: number; followers?: number; following?: number };
  bio?: string | null;
  website?: string | null;
  location?: string | null;
};

type PostRow = {
  id: string;
  content: string;
  imageUrl?: string | null;
  authorId: string;
  createdAt: string;
};

export default function AdminPage() {
  const { user: currentUser, authFetch } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<{ type: "user" | "post"; id: string } | null>(null);

  const [postsForUser, setPostsForUser] = useState<Record<string, PostRow[]>>({});
  const [postsLoading, setPostsLoading] = useState<Record<string, boolean>>({});
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  // Fetch all users (admin API)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load users (admin only)");
    } finally {
      setLoading(false);
    }
  };

  // Search & filter result
  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (u.username ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (`${u.firstName ?? ""} ${u.lastName ?? ""}`).toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  // initial selection when users change
  useEffect(() => {
    if (!selectedUser && filtered.length > 0) setSelectedUser(filtered[0]);
    if (selectedUser && !filtered.find((u) => u.id === selectedUser.id)) setSelectedUser(filtered[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, query, roleFilter]);

  const openEdit = (u: UserRow) => {
    setSelectedUser(u);
    setEditOpen(true);
  };

  // Update user patch
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await authFetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedUser.username,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          bio: selectedUser.bio,
          website: selectedUser.website,
          location: selectedUser.location,
          role: selectedUser.role,
          isActive: selectedUser.isActive,
          isVerified: selectedUser.isVerified,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      setUsers((prev) => prev.map((p) => (p.id === data.user.id ? data.user : p)));
      setEditOpen(false);
      setSelectedUser(data.user);
      toast.success("User updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    }
  };

  const confirmDeleteUser = (id: string) => {
    setConfirmOpen({ type: "user", id });
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
      setConfirmOpen(null);
      toast.success("User deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  const loadPostsForUser = async (userId: string) => {
    if (postsForUser[userId] || postsLoading[userId]) return;
    setPostsLoading((s) => ({ ...s, [userId]: true }));
    try {
      const res = await authFetch(`/api/admin/users/${userId}/posts`);
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPostsForUser((s) => ({ ...s, [userId]: data.posts ?? [] }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load posts");
    } finally {
      setPostsLoading((s) => ({ ...s, [userId]: false }));
    }
  };

  const confirmDeletePost = (postId: string) => {
    setConfirmOpen({ type: "post", id: postId });
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await authFetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete post failed");
      // remove post locally
      setPostsForUser((s) => {
        const copy = { ...s };
        Object.keys(copy).forEach((k) => {
          copy[k] = copy[k].filter((p) => p.id !== postId);
        });
        return copy;
      });
      // adjust counts (best effort)
      setUsers((prev) => prev.map((u) => u._count ? { ...u, _count: { ...u._count, posts: Math.max(0, (u._count?.posts ?? 1) - 1) } } : u));
      setConfirmOpen(null);
      toast.success("Post deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete post");
    }
  };

  const initials = (u: UserRow) => (u.firstName?.[0] ?? u.username?.[0] ?? u.email[0] ?? "U").toUpperCase();

  // small loading skeleton
  const UserSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded bg-muted/40">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded w-1/2 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users and moderate posts</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground mr-2">Signed in as: {currentUser?.id ?? "—"}</span>
          <Button onClick={() => setRefreshToken((s) => s + 1)}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: user list + controls */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="mb-4">
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name, username or email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60" size={16} />
                </div>

                <Select onValueChange={(val) => setRoleFilter(val as any)} defaultValue="ALL">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="USER">Users</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">Users</div>

              <ScrollArea className="h-[56vh]">
                <div className="space-y-2">
                  {loading ? (
                    <UserSkeleton />
                  ) : filtered.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No users found</div>
                  ) : (
                    filtered.map((u) => {
                      const active = selectedUser?.id === u.id;
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            loadPostsForUser(u.id);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition ${active ? "bg-primary/5 border border-primary/20" : "hover:bg-muted"}`}
                        >
                          <Avatar className="w-12 h-12">
                            {u.avatarUrl ? <AvatarImage src={u.avatarUrl} /> : <AvatarFallback>{initials(u)}</AvatarFallback>}
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                <div className="font-medium truncate">{u.firstName ? `${u.firstName} ${u.lastName ?? ""}`.trim() : u.username ?? u.email}</div>
                                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant={u.isActive ? "secondary" : "destructive"} className="capitalize">
                                  {u.isActive ? "active" : "inactive"}
                                </Badge>
                                {u.isVerified ? <Badge className="hidden sm:inline-flex">verified</Badge> : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <div className="inline-flex items-center gap-2">
                                <UserPlus size={14} />
                                <span>{u._count?.followers ?? 0}</span>
                              </div>
                              <div className="inline-flex items-center gap-2">
                                <UserMinus size={14} />
                                <span>{u._count?.following ?? 0}</span>
                              </div>
                              <div className="inline-flex items-center gap-2">
                                <span className="font-medium">{u._count?.posts ?? 0}</span>
                                <span>posts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: selected user details */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="mb-4">
            <CardContent>
              {!selectedUser ? (
                <div className="p-6 text-center text-muted-foreground">Select a user to view details</div>
              ) : (
                <>
                  <div className="flex items-start gap-6">
                    <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                      {selectedUser.avatarUrl ? <AvatarImage src={selectedUser.avatarUrl} /> : <AvatarFallback>{initials(selectedUser)}</AvatarFallback>}
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-lg font-semibold">{selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName ?? ""}`.trim() : selectedUser.username ?? selectedUser.email}</h2>
                          <div className="text-sm text-muted-foreground">@{selectedUser.username ?? "—"}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(selectedUser)}>
                            <Edit className="mr-2" /> Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => confirmDeleteUser(selectedUser.id)}>
                            <Trash className="mr-2" /> Delete
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="text-sm">{selectedUser.bio ?? <span className="text-muted-foreground">No bio</span>}</div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div>📍 {selectedUser.location ?? "—"}</div>
                          <div>🔗 {selectedUser.website ? <a className="text-primary hover:underline" href={selectedUser.website} target="_blank" rel="noreferrer">{selectedUser.website}</a> : "—"}</div>
                          <div>🕒 Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Posts list */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">Recent posts</h3>
                      <div className="text-xs text-muted-foreground">{(postsForUser[selectedUser.id]?.length ?? 0)} items</div>
                    </div>

                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {postsLoading[selectedUser.id] ? (
                          <div className="text-sm text-muted-foreground">Loading posts…</div>
                        ) : (postsForUser[selectedUser.id] ?? []).length === 0 ? (
                          <div className="text-sm text-muted-foreground">No posts loaded. Click "Load posts" to fetch.</div>
                        ) : (
                          postsForUser[selectedUser.id].map((p) => (
                            <div key={p.id} className="flex gap-4 items-start p-3 rounded-md border hover:shadow-sm transition">
                              <div className="flex-1">
                                <div className="text-sm line-clamp-3">{p.content}</div>
                                {p.imageUrl && <img src={p.imageUrl} alt="post" className="mt-2 max-h-40 w-full rounded object-cover" />}
                                <div className="text-xs text-muted-foreground mt-2">{new Date(p.createdAt).toLocaleString()}</div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Button size="sm" variant="ghost" onClick={() => window.open(`/post/${p.id}`, "_blank")}>View</Button>
                                <Button size="sm" variant="destructive" onClick={() => confirmDeletePost(p.id)}>Delete</Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    <div className="flex justify-end mt-3">
                      <Button variant="outline" onClick={() => loadPostsForUser(selectedUser.id)}>Load posts</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={() => setEditOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="space-y-3">
                <Input
                  value={selectedUser.username ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                  placeholder="Username"
                />
                <Input
                  value={selectedUser.firstName ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                  placeholder="First name"
                />
                <Input
                  value={selectedUser.lastName ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                  placeholder="Last name"
                />
                <Input value={selectedUser.email} disabled />
                <Textarea
                  value={selectedUser.bio ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, bio: e.target.value })}
                  placeholder="Bio"
                />
              </div>

              <div className="space-y-3">
                <Input
                  value={selectedUser.website ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, website: e.target.value })}
                  placeholder="Website"
                />
                <Input
                  value={selectedUser.location ?? ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, location: e.target.value })}
                  placeholder="Location"
                />

                <div>
                  <div className="text-xs text-muted-foreground mb-2">Role</div>
                  <Select
                    defaultValue={selectedUser.role}
                    onValueChange={(val) => setSelectedUser({ ...selectedUser, role: val as "USER" | "ADMIN" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedUser.role} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2">Active</div>
                  <Select defaultValue={selectedUser.isActive ? "true" : "false"} onValueChange={(v) => setSelectedUser({ ...selectedUser, isActive: v === "true" })}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedUser.isActive ? "true" : "false"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">true</SelectItem>
                      <SelectItem value="false">false</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpdateUser} className="flex-1"><Check className="mr-2" /> Save</Button>
                  <Button variant="ghost" onClick={() => setEditOpen(false)} className="flex-1"><X className="mr-2" /> Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!confirmOpen} onOpenChange={() => setConfirmOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
          </DialogHeader>

          <div className="mt-3 space-y-4">
            <p>Are you sure? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmOpen(null)}>Cancel</Button>
              {confirmOpen?.type === "user" ? (
                <Button variant="destructive" onClick={() => confirmOpen && handleDeleteUser(confirmOpen.id)}>Delete user</Button>
              ) : (
                <Button variant="destructive" onClick={() => confirmOpen && handleDeletePost(confirmOpen.id)}>Delete post</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
