"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
  };
  content: string;
  images?: string[];
  likes: any[];
  likeCount: number;
  shares: any[];
  shareCount: number;
  comments: any[];
  commentCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [shareContent, setShareContent] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(page < data.pagination.pages);
      } else if (response.status === 401) {
        setPosts([]);
        setHasMore(false);
        if (page === 1) toast("Sign in to see your social feed", { icon: "🔒" });
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [page, fetchPosts]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setPosting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newPostContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts([data.post, ...posts]);
        setNewPostContent("");
        toast.success("Post created successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Post creation error:", error);
      toast.error("Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(
          posts.map(post =>
            post._id === postId
              ? {
                  ...post,
                  likeCount: data.likeCount,
                  likes: data.liked ? [...post.likes, "current"] : post.likes.filter(l => l !== "current"),
                }
              : post,
          ),
        );
      }
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Failed to like post");
    }
  };

  const handleShare = async () => {
    if (!shareModalPost) return;

    try {
      const response = await fetch(`/api/posts/${shareModalPost._id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: shareContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts([data.post, ...posts]);
        setShareModalPost(null);
        setShareContent("");
        toast.success("Post shared successfully");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share post");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Share Your Space Discoveries</h3>
        <textarea
          value={newPostContent}
          onChange={e => setNewPostContent(e.target.value)}
          placeholder="What's happening in space today? Share your findings, thoughts, or questions..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
          rows={3}
          maxLength={1000}
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">{newPostContent.length}/1000 characters</span>
          <button
            onClick={handleCreatePost}
            disabled={posting || !newPostContent.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      {loading && page === 1 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-6">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {post.author.avatar ? (
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name || post.author.username}
                        width={40}
                        height={40}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      post.author.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{post.author.name || post.author.username}</p>
                    <p className="text-sm text-gray-500">
                      @{post.author.username} · {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {post.images.map((image, index) => (
                      <Image
                        key={index}
                        src={image}
                        alt=""
                        width={300}
                        height={192}
                        className="rounded-lg object-cover w-full h-48"
                      />
                    ))}
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-sm text-indigo-600 hover:underline cursor-pointer">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleLike(post._id)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{post.likeCount}</span>
                </button>

                <button
                  onClick={() => {
                    setShareModalPost(post);
                    setShareContent("");
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m9.032 4.026A9.001 9.001 0 012.968 7.326"
                    />
                  </svg>
                  <span>{post.shareCount}</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>{post.commentCount}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="text-center py-4">
          <button
            onClick={() => setPage(page + 1)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Load More
          </button>
        </div>
      )}

      {/* Share Modal */}
      {shareModalPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Share Post</h3>
            <textarea
              value={shareContent}
              onChange={e => setShareContent(e.target.value)}
              placeholder="Add your thoughts..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Original post by @{shareModalPost.author.username}:</p>
              <p className="text-sm mt-1">{shareModalPost.content.substring(0, 100)}...</p>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShareModalPost(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
