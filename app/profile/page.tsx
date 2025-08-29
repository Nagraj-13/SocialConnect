"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProfileSkeleton } from "../loaders/skeletonLoaders";

const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/6.x/adventurer/svg?seed=Wizard",
  "https://api.dicebear.com/6.x/adventurer/svg?seed=Robot",
  "https://api.dicebear.com/6.x/adventurer/svg?seed=Dragon",
  "https://api.dicebear.com/6.x/adventurer/svg?seed=Knight",
  "https://api.dicebear.com/6.x/adventurer/svg?seed=Alien",
  "https://api.dicebear.com/6.x/bottts/svg?seed=Cat",
  "https://api.dicebear.com/6.x/bottts/svg?seed=Dog",
  "https://api.dicebear.com/6.x/bottts/svg?seed=Fox",
  "https://api.dicebear.com/6.x/bottts/svg?seed=Panda",
  "https://api.dicebear.com/6.x/bottts/svg?seed=Tiger",
];

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any | null>(null);
  const [form, setForm] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);

  useEffect(() => {
    if (!authUser) return;

    const fetchProfile = async () => {
      setLoading(true);

      const { data: profile, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userError) {
        console.error("Error loading profile", userError);
        setLoading(false);
        router.push("/auth");
        return;
      }

      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, image_url, created_at")
        .eq("author_id", authUser.id)
        .order("created_at", { ascending: false });

      const { data: followers } = await supabase
        .from("follows")
        .select(
          "follower:users!follows_follower_id_fkey(id, username, avatar_url)"
        )
        .eq("following_id", authUser.id);

      const { data: following } = await supabase
        .from("follows")
        .select(
          "following:users!follows_following_id_fkey(id, username, avatar_url)"
        )
        .eq("follower_id", authUser.id);

      const merged = {
        ...profile,
        posts: posts || [],
        followers: followers?.map((f: any) => f.follower) || [],
        following: following?.map((f: any) => f.following) || [],
      };

      setUser(merged);
      setForm(merged);
      setLoading(false);
    };

    fetchProfile();
  }, [authUser, supabase, router]);

  // Handle input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${authUser?.id}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) return toast.error("Avatar upload failed");

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    setForm({ ...form, avatar_url: urlData.publicUrl });
  };

  // Save profile
  const handleSave = async () => {
    if (!form || !authUser) return;

    const { error } = await supabase
      .from("users")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        bio: form.bio,
        website: form.website,
        location: form.location,
        avatar_url: form.avatar_url,
      })
      .eq("id", authUser.id);

    if (error) toast.error("Profile update failed");
    else {
      setUser(form);
      setEditMode(false);
      toast.success("Profile updated");
    }
  };
  const [editPost, setEditPost] = useState<any | null>(null);

  // Save edited post
  const handleUpdatePost = async () => {
    if (!editPost) return;

    const { error } = await supabase
      .from("posts")
      .update({
        content: editPost.content,
        image_url: editPost.image_url,
      })
      .eq("id", editPost.id);

    if (error) {
      toast.error("Failed to update post");
    } else {
      toast.success("Post updated");
      setUser((prev: any) => ({
        ...prev,
        posts: prev.posts.map((p: any) =>
          p.id === editPost.id ? { ...p, ...editPost } : p
        ),
      }));
      setEditPost(null);
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted");
      setUser((prev: any) => ({
        ...prev,
        posts: prev.posts.filter((p: any) => p.id !== postId),
      }));
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!user) return <p className="p-6">No profile found</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <ScrollArea className="h-[80vh] w-full px-4 ">
        <Card className="shadow-md hover:shadow-lg transition">
          <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
            <Avatar className="w-24 h-24 ring-2 ring-primary/20">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.first_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-2xl font-bold">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-muted-foreground">@{user.username}</p>
              <p>{user.bio}</p>
              <p className="text-sm text-muted-foreground">
                📍 {user.location}
              </p>
              <p className="text-sm text-muted-foreground">
                🌐{" "}
                <a href={user.website} className="text-primary hover:underline">
                  {user.website}
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(user.created_at).toDateString()}
              </p>

              {/* Stats */}
              <div className="flex gap-6 mt-2 justify-center md:justify-start text-sm">
                <Button
                  onClick={() => setOpenFollowers(true)}
                  className="hover:underline  bg-transparent text-foreground hover:bg-transparent hover:text-foreground"
                >
                  <strong>{user.followers.length}</strong> Followers
                </Button>
                <Button
                  onClick={() => setOpenFollowing(true)}
                  className="hover:underline bg-transparent text-foreground hover:bg-transparent hover:text-foreground"
                >
                  <strong>{user.following.length}</strong> Following
                </Button>
                <Button className=" bg-transparent text-foreground hover:bg-transparent hover:text-foreground">
                  <strong>{user.posts.length}</strong> Posts
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="mt-3"
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Posts */}
          <TabsContent value="posts" className="mt-4">
            {user.posts.length === 0 && (
              <p className="text-muted-foreground">No posts yet</p>
            )}

            <div className="space-y-4">
              {user.posts.map((post: any) => (
                <Card key={post.id} className="hover:shadow transition">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <p>{post.content}</p>
                      {/* Post Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setForm({ ...post }); // preload post into form state
                            setEditPost(post); // track which post is being edited
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="post"
                        className="rounded-lg max-h-60 object-cover w-full"
                      />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Edit Post Dialog */}
            <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    name="content"
                    value={editPost?.content || ""}
                    onChange={(e) =>
                      setEditPost({ ...editPost, content: e.target.value })
                    }
                    placeholder="Update your post..."
                  />
                  <Input
                    name="image_url"
                    value={editPost?.image_url || ""}
                    onChange={(e) =>
                      setEditPost({ ...editPost, image_url: e.target.value })
                    }
                    placeholder="Image URL (optional)"
                  />
                  <Button onClick={handleUpdatePost} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* About */}
          <TabsContent value="about" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <p>
                  <strong>Email:</strong> {authUser?.email || "hidden"}
                </p>
                <p>
                  <strong>Location:</strong> {user.location}
                </p>
                <p>
                  <strong>Website:</strong> {user.website}
                </p>
                <p>
                  <strong>Joined:</strong>{" "}
                  {new Date(user.created_at).toDateString()}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        {editMode && form && (
          <Dialog open={editMode} onOpenChange={setEditMode}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  name="first_name"
                  value={form.first_name || ""}
                  onChange={handleChange}
                  placeholder="First Name"
                />
                <Input
                  name="last_name"
                  value={form.last_name || ""}
                  onChange={handleChange}
                  placeholder="Last Name"
                />
                <Input
                  name="username"
                  value={form.username || ""}
                  onChange={handleChange}
                  placeholder="Username"
                />
                <Textarea
                  name="bio"
                  value={form.bio || ""}
                  onChange={handleChange}
                  placeholder="Bio"
                />
                <Input
                  name="website"
                  value={form.website || ""}
                  onChange={handleChange}
                  placeholder="Website"
                />
                <Input
                  name="location"
                  value={form.location || ""}
                  onChange={handleChange}
                  placeholder="Location"
                />

                {/* Avatar picker */}
                <ScrollArea className="h-32">
                  <div className="flex gap-2 flex-wrap">
                    {PREDEFINED_AVATARS.map((url) => (
                      <Avatar
                        key={url}
                        className={`w-16 h-16 border-2 cursor-pointer transition ${
                          form.avatar_url === url
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                        onClick={() => setForm({ ...form, avatar_url: url })}
                      >
                        <AvatarImage src={url} />
                      </Avatar>
                    ))}
                  </div>
                </ScrollArea>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />

                <Button onClick={handleSave} className="w-full">
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Followers */}
        <Dialog open={openFollowers} onOpenChange={setOpenFollowers}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Followers</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-72 pr-2">
              <div className="space-y-3">
                {user.followers.map((f: any) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={f.avatar_url} />
                      <AvatarFallback>{f.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>@{f.username}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Following */}
        <Dialog open={openFollowing} onOpenChange={setOpenFollowing}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Following</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-72 pr-2">
              <div className="space-y-3">
                {user.following.map((f: any) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={f.avatar_url} />
                      <AvatarFallback>{f.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>@{f.username}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </ScrollArea>
    </div>
  );
}
