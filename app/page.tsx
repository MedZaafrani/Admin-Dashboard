"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/auth/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center max-w-md p-8">
        <h1 className="text-4xl font-bold text-primary mb-6">
          Panneau d&apos;administration
        </h1>
        <p className="text-muted-foreground mb-8">
          Comprehensive management system for the Smart Dashboardplatform.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </div>
      </div>
    </div>
  );
}
