"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isLogin) {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific error messages
        if (result.error.includes("verify your email")) {
          setError("Please verify your email before signing in. Check your email for a verification link.");
        } else if (result.error.includes("Too many")) {
          setError(result.error);
        } else {
          setError("Invalid email or password");
        }
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } else {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, name: email.split("@")[0] }),
        });

        const data = await response.json();
        console.log("Registration response:", response.status, data);

        if (!response.ok) {
          // Handle specific registration errors
          if (data.error?.includes("already exists")) {
            setError("An account with this email already exists. Please try logging in instead.");
          } else if (data.error?.includes("Password")) {
            setError(data.error);
          } else if (data.error?.includes("email")) {
            setError("Please provide a valid email address.");
          } else if (data.error?.includes("Too many")) {
            setError(data.error);
          } else {
            setError(data.error || "Registration failed. Please try again.");
          }
          setLoading(false);
        } else {
          // Successfully registered, redirect to email verification
          setMessage("Account created successfully! Please check your email and click the verification link.");
          setEmail("");
          setPassword("");
          setIsLogin(true); // Switch to login mode

          // In development, show the verification URL in console
          if (data.verificationUrl) {
            console.log("Click this link to verify your email:", data.verificationUrl);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error("Registration error:", err);
        setError("An error occurred during registration. Please try again.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image src="/LunarBkg1.png" alt="Lunargistics Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
        <div className="absolute bottom-10 left-10 text-white">
          <h2 className="text-4xl font-bold mb-2">Welcome to Lunargistics</h2>
          <p className="text-lg opacity-90">Your gateway to asteroid commodity trading</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        {/* Mobile Background Image */}
        <div className="lg:hidden fixed inset-0 z-0">
          <Image src="/LunarBkg1.png" alt="Lunargistics Background" fill className="object-cover opacity-10" priority />
        </div>

        <div className="bg-white/95 backdrop-blur-sm p-8 lg:p-12 rounded-3xl shadow-2xl w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Lunargistics</h1>
            <p className="text-gray-600">{isLogin ? "Sign in to your account" : "Create a new account"}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-black"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-black"
                placeholder="Enter your password"
                required
                minLength={12}
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-2">
                  Password must be at least 12 characters with uppercase, lowercase, number, and special character
                </p>
              )}
            </div>

            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}

            {message && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm">{message}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6 text-center">
              <a href="/forgot-password" className="text-sm text-gray-600 hover:text-indigo-600 transition">
                Forgot your password?
              </a>
            </div>
          )}

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={async e => {
                e.preventDefault();
                try {
                  await signIn("google", { callbackUrl: "/dashboard" });
                } catch (error) {
                  console.error("Google login error:", error);
                }
              }}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={async e => {
                e.preventDefault();
                try {
                  await signIn("github", { callbackUrl: "/dashboard" });
                } catch (error) {
                  console.error("GitHub login error:", error);
                }
              }}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="mt-8 text-center space-y-3">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setMessage("");
              }}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>

            <div className="text-xs text-gray-500">
              By {isLogin ? "signing in" : "creating an account"}, you agree to our{" "}
              <a href="/terms" className="text-indigo-600 hover:text-indigo-800 underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="/policy" className="text-indigo-600 hover:text-indigo-800 underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
