import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPost extends Document {
  author: string;
  content: string;
  images?: string[];
  likes: string[];
  likeCount: number;
  shares: string[];
  shareCount: number;
  comments: {
    author: string;
    content: string;
    createdAt: Date;
  }[];
  commentCount: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      maxlength: [1000, "Post content must be less than 1000 characters"],
    },
    images: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    shares: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    shareCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        author: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: [500, "Comment must be less than 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Update counts before saving
PostSchema.pre("save", function (next) {
  this.likeCount = this.likes.length;
  this.shareCount = this.shares.length;
  this.commentCount = this.comments.length;
  next();
});

// Index for feed queries
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
