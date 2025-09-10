"use client";

import { signIn } from "next-auth/react";

export default function TestAuth() {
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test OAuth</h1>
      <button
        onClick={() => {
          console.log("GitHub button clicked");
          signIn("github", { callbackUrl: "/dashboard" })
            .then(() => console.log("SignIn initiated"))
            .catch(err => console.error("SignIn error:", err));
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test GitHub Login
      </button>
    </div>
  );
}
