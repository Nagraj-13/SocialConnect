"use client";

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UserListSkeleton() {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardHeader>

      <CardContent>
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>

      <CardFooter>
        <Skeleton className="h-9 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

  export const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );



export  function PostSkeleton() {
  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm space-y-4">
      {/* header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* image */}
      <Skeleton className="w-full h-56 rounded-lg" />

      {/* actions */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-12" />
      </div>

      {/* comment input */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </article>
  );
}



export  function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex gap-6 items-center">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
