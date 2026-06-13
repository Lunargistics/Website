/**
 * Post types.
 *
 * Migrated from Mongoose to Prisma. The Prisma model lives in
 * `prisma/schema.prisma`; this file only carries the shared TS shapes used by
 * the social/output routes. References (author, likes, shares, comment authors)
 * are plain string user ids — former `.populate()` is now done explicitly in
 * the route handlers.
 */

export interface IPostComment {
  author: string;
  content: string;
  createdAt: Date | string;
}

export interface IPost {
  author: string;
  content: string;
  images?: string[];
  likes: string[];
  likeCount: number;
  shares: string[];
  shareCount: number;
  comments: IPostComment[];
  commentCount: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
