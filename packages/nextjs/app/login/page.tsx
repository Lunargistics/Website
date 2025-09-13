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
      return;
    }
    // Guard: avoid calling login if Privy isn't initialized (invalid app ID)
    try {
      if (typeof login === "function") {
        login();
      }
    } catch (e) {
      console.error("Privy login failed or not initialized", e);
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
