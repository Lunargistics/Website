"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import toast from "react-hot-toast";
import { useAccount, useSignMessage } from "wagmi";
import {
  CheckIcon,
  LinkIcon,
  PencilSquareIcon,
  UserCircleIcon,
  WalletIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface UserProfile {
  _id: string;
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  walletAddress?: string;
  followerCount: number;
  followingCount: number;
  followers: any[];
  following: any[];
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setName(data.user.name || "");
        setBio(data.user.bio || "");
        setAvatar(data.user.avatar || "");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, bio, avatar }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditing(false);
        toast.success("Profile updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleConnectWallet = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    try {
      const message = `Connect wallet to Lunargistics account: ${profile?.username}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      void signature;

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        toast.success("Wallet connected successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to connect wallet");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: null }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        toast.success("Wallet disconnected");
      }
    } catch (error) {
      console.error("Wallet disconnect error:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="text-center py-8">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
          <p className="text-gray-400">Manage your identity and connections</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={name || profile.username}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-16 h-16" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>

              {/* User Info */}
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.name || profile.username}</h2>
                <p className="text-purple-400 font-mono">@{profile.username}</p>
                {profile.walletAddress && (
                  <div className="flex items-center gap-2 mt-2">
                    <WalletIcon className="w-4 h-4 text-gray-400" />
                    <code className="text-sm text-gray-400">
                      {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-600/20"
            >
              {editing ? (
                <>
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <PencilSquareIcon className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{profile.followerCount}</span>
              <span className="text-gray-400">Followers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{profile.followingCount}</span>
              <span className="text-gray-400">Following</span>
            </div>
          </div>

          {/* Bio */}
          {(profile.bio || editing) && (
            <div className="mt-6">
              {editing ? (
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  maxLength={500}
                />
              ) : (
                <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          )}
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Profile Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your display name"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
              <input
                type="url"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-600/20"
              >
                <CheckIcon className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Wallet Connection */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Wallet Connection</h3>
          {profile.walletAddress ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-sm text-gray-400">Connected Wallet</p>
                    <code className="font-mono text-sm text-gray-200">
                      {profile.walletAddress.slice(0, 10)}...{profile.walletAddress.slice(-8)}
                    </code>
                  </div>
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  className="px-4 py-2 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-all duration-200"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400">
                Connect your wallet to access Web3 features and verify your identity on-chain.
              </p>
              <button
                onClick={handleConnectWallet}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-600/20"
              >
                <LinkIcon className="w-4 h-4" />
                {isConnected ? `Connect ${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
              </button>
            </div>
          )}
        </div>

        {/* Following/Followers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Followers */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Followers</h3>
            {profile.followers.length > 0 ? (
              <div className="space-y-3">
                {profile.followers.slice(0, 5).map((follower: any) => (
                  <div
                    key={follower._id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{follower.name || follower.username}</p>
                      <p className="text-sm text-gray-400">@{follower.username}</p>
                    </div>
                  </div>
                ))}
                {profile.followers.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    +{profile.followers.length - 5} more followers
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No followers yet</p>
            )}
          </div>

          {/* Following */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Following</h3>
            {profile.following.length > 0 ? (
              <div className="space-y-3">
                {profile.following.slice(0, 5).map((following: any) => (
                  <div
                    key={following._id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{following.name || following.username}</p>
                      <p className="text-sm text-gray-400">@{following.username}</p>
                    </div>
                  </div>
                ))}
                {profile.following.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    +{profile.following.length - 5} more following
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Not following anyone yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
