import dbConnect from "./mongodb";
import { loginRateLimiter } from "./rateLimiter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import User from "~~/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Rate limiting for login attempts
        const clientIP =
          (request as any)?.headers?.get?.("x-forwarded-for")?.split(",")[0] ||
          (request as any)?.headers?.get?.("x-real-ip") ||
          (request as any)?.headers?.get?.("x-client-ip") ||
          "unknown";

        const rateLimit = loginRateLimiter.check(clientIP);

        if (!rateLimit.allowed) {
          const resetDate = new Date(rateLimit.resetTime);
          throw new Error(`Too many login attempts. Please try again after ${resetDate.toLocaleTimeString()}.`);
        }

        await dbConnect();

        const user = await User.findOne({ emailLower: credentials.email.toLowerCase() });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await user.comparePassword(credentials.password);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in. Check your email for a verification link.");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || user.email,
          emailVerified: user.emailVerified,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle social login user creation
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          await dbConnect();

          // Check if user already exists
          const existingUser = await User.findOne({ emailLower: user.email!.toLowerCase() });

          if (existingUser) {
            // Update user info if needed
            if (!existingUser.name && user.name) {
              existingUser.name = user.name;
              await existingUser.save();
            }
            return true;
          }

          // Create new user from social login
          const newUser = new User({
            email: user.email,
            emailLower: user.email!.toLowerCase(),
            name: user.name || user.email!.split("@")[0],
            emailVerified: true, // Social logins are pre-verified
            password: Math.random().toString(36), // Dummy password for social users
          });

          await newUser.save();
          return true;
        } catch (error) {
          console.error("Social login error:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          emailVerified: token.emailVerified as boolean,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
