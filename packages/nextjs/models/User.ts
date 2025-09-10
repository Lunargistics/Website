import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  emailLower: string;
  password: string;
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  walletAddress?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  followers: string[];
  following: string[];
  followerCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
  createEmailVerificationToken(): string;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      validate: {
        validator: function (email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
    emailLower: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [12, "Password must be at least 12 characters"],
      validate: {
        validator: function (password: string) {
          // Check for at least one uppercase letter
          if (!/[A-Z]/.test(password)) return false;
          // Check for at least one lowercase letter
          if (!/[a-z]/.test(password)) return false;
          // Check for at least one number
          if (!/[0-9]/.test(password)) return false;
          // Check for at least one special character
          if (!/[!@#$%^&*()_+=\[\]{};':",.<>?/|\-]/.test(password)) return false;
          return true;
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
    },
    name: {
      type: String,
      maxlength: [100, "Name must be less than 100 characters"],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be less than 30 characters"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio must be less than 500 characters"],
    },
    avatar: {
      type: String,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followerCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Set emailLower before validation
UserSchema.pre("validate", function (next) {
  if (this.email) {
    this.emailLower = this.email.toLowerCase();
  }
  next();
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Update follower/following counts
UserSchema.pre("save", function (next) {
  this.followerCount = this.followers.length;
  this.followingCount = this.following.length;
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Create password reset token
UserSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  return resetToken;
};

// Create email verification token
UserSchema.methods.createEmailVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return verificationToken;
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
