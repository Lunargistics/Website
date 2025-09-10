"use client";

import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import toast from "react-hot-toast";
import { useAccount, useSignMessage } from "wagmi";

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
      // Sign a message to prove wallet ownership
      const message = `Connect wallet to Lunar Gistics account: ${profile?.username}\nTimestamp: ${Date.now()}`;
      const _signature = await signMessageAsync({ message });

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-8">Profile not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {avatar ? (
                <img src={avatar} alt={name || username} className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{profile.name || profile.username}</h2>
              <p className="text-gray-600">@{profile.username}</p>
              {profile.walletAddress && (
                <p className="text-sm text-gray-500 mt-1">
                  {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Stats */}
        <div className="flex space-x-6 mt-6 pt-6 border-t border-gray-200">
          <div>
            <span className="font-bold text-xl">{profile.followerCount}</span>
            <span className="text-gray-600 ml-1">Followers</span>
          </div>
          <div>
            <span className="font-bold text-xl">{profile.followingCount}</span>
            <span className="text-gray-600 ml-1">Following</span>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                rows={3}
                maxLength={500}
              />
            ) : (
              <p className="text-gray-700">{profile.bio}</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your display name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
            <input
              type="url"
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProfile}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Wallet Connection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Wallet Connection</h3>
        {profile.walletAddress ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Connected Wallet</p>
                <p className="font-mono text-sm">
                  {profile.walletAddress.slice(0, 10)}...{profile.walletAddress.slice(-8)}
                </p>
              </div>
              <button
                onClick={handleDisconnectWallet}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Connect your wallet to access Web3 features and verify your identity on-chain.
            </p>
            <button
              onClick={handleConnectWallet}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              {isConnected ? `Connect ${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
            </button>
          </div>
        )}
      </div>

      {/* Following/Followers Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Followers</h3>
          {profile.followers.length > 0 ? (
            <div className="space-y-2">
              {profile.followers.slice(0, 5).map((follower: any) => (
                <div key={follower._id} className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium">{follower.name || follower.username}</p>
                    <p className="text-sm text-gray-500">@{follower.username}</p>
                  </div>
                </div>
              ))}
              {profile.followers.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">+{profile.followers.length - 5} more</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No followers yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Following</h3>
          {profile.following.length > 0 ? (
            <div className="space-y-2">
              {profile.following.slice(0, 5).map((following: any) => (
                <div key={following._id} className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium">{following.name || following.username}</p>
                    <p className="text-sm text-gray-500">@{following.username}</p>
                  </div>
                </div>
              ))}
              {profile.following.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">+{profile.following.length - 5} more</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Not following anyone yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
