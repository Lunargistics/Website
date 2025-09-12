"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, authenticated } = usePrivy();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (authenticated) {
      router.push("/dashboard");
    } else {
      // Open Privy login modal
      login();
      // Redirect to home page (Privy modal will handle auth)
      router.push("/");
    }
  }, [authenticated, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Redirecting to login...</h2>
        <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
      </div>
    </div>
  );
}
