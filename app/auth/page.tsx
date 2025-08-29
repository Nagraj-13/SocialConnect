"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/authContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LoginForm from "./login";
import SignupForm from "./signup";
import { Toaster } from "sonner";

function InnerAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold">
            Welcome — Sign in or Create an account
          </CardTitle>
        </CardHeader>

        <CardContent className="flex">
          <Tabs defaultValue="login" className="w-full transition-all duration-300">
            <TabsList className="w-full ">
              <TabsTrigger
                value="login"
                className="transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-black rounded-lg"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-black rounded-lg"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="login" className="transition-all duration-300">
                <LoginForm />
              </TabsContent>

              <TabsContent value="signup" className="transition-all duration-300">
                <SignupForm />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function AuthPage() {
  return (
    <AuthProvider>
      <InnerAuth />
    </AuthProvider>
  );
}
