"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      const paths: Record<string, string> = {
        employee: "/employee/dashboard",
        company_admin: "/company/dashboard",
        company_hr: "/company/dashboard",
        venue_staff: "/venue/dashboard",
        admin: "/company/dashboard",
      };
      router.push(paths[user.role] || "/login");
    } else {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
