"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * UserContext
 * - loads the current user's profile from the `users` table (Supabase)
 * - exposes helpers to refresh and update the profile and upload avatar images
 * - keeps a small cache in memory
 *
 * Usage:
 *  const { profile, loading, refresh, updateProfile, uploadAvatar } = useUser();
 */

export type Profile = {
  id: string;
  email?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  location?: string | null;
  created_at?: string | null;
  // lightweight relations (filled on load)
  posts?: any[];
  followers?: any[];
  following?: any[];
};

type UserContextValue = {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfileLocal: (p: Partial<Profile>) => void;
  updateProfile: (data: Partial<Profile>) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (!authUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // load base user row
      const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userErr) {
        console.error("Failed to load profile", userErr);
        setProfile(null);
        setLoading(false);
        return;
      }

      // lightweight: fetch posts, followers, following counts (or items)
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, created_at")
        .eq("author_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: followers } = await supabase
        .from("follows")
        .select("follower:users!follows_follower_id_fkey(id, username, avatar_url)")
        .eq("following_id", authUser.id)
        .limit(100);

      const { data: following } = await supabase
        .from("follows")
        .select("following:users!follows_following_id_fkey(id, username, avatar_url)")
        .eq("follower_id", authUser.id)
        .limit(100);

      const merged: Profile = {
        ...userRow,
        posts: posts ?? [],
        followers: (followers ?? []).map((f: any) => f.follower),
        following: (following ?? []).map((f: any) => f.following),
      };

      setProfile(merged);
    } catch (err) {
      console.error("fetchProfile error", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // load when authUser changes
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  const refresh = async () => {
    await fetchProfile();
  };

  const setProfileLocal = (p: Partial<Profile>) => {
    setProfile((prev) => ({ ...(prev ?? {}), ...p } as Profile));
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!authUser) return false;
    try {
      const updates: Record<string, any> = {};
      if (data.first_name !== undefined) updates.first_name = data.first_name;
      if (data.last_name !== undefined) updates.last_name = data.last_name;
      if (data.username !== undefined) updates.username = data.username;
      if (data.bio !== undefined) updates.bio = data.bio;
      if (data.website !== undefined) updates.website = data.website;
      if (data.location !== undefined) updates.location = data.location;
      if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

      const { error } = await supabase.from("users").update(updates).eq("id", authUser.id);
      if (error) {
        console.error("updateProfile error", error);
        toast.error("Failed to update profile");
        return false;
      }
      await fetchProfile();
      toast.success("Profile updated");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!authUser) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${authUser.id}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    try {
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl ?? null;
      // update profile row with avatar URL
      if (publicUrl) {
        await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", authUser.id);
        setProfileLocal({ avatar_url: publicUrl });
      }
      return publicUrl;
    } catch (err) {
      console.error("uploadAvatar error", err);
      toast.error("Avatar upload failed");
      return null;
    }
  };

  const value: UserContextValue = {
    profile,
    loading,
    refresh,
    setProfileLocal,
    updateProfile,
    uploadAvatar,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Example usage:
 *
 * import { useUser } from "@/context/userContext";
 *
 * const { profile, loading, updateProfile, uploadAvatar } = useUser();
 */
