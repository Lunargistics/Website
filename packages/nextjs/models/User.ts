/**
 * User Model
 * MongoDB schema for user accounts and profiles
 */
import bcrypt from "bcryptjs";
import mongoose, { Document, Model, Schema } from "mongoose";

export enum UserRole {
  ADMIN = "ADMIN",
  MISSION_MANAGER = "MISSION_MANAGER",
  ENGINEER = "ENGINEER",
  ANALYST = "ANALYST",
  VIEWER = "VIEWER",
}

export interface IUser extends Document {
  userId: string;
  email: string;
  password?: string;
  name: string;
  roles: UserRole[];

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hashPassword(): Promise<void>;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  hasRole(role: UserRole): boolean;
  hasPermission(permission: string): boolean;
  generateApiKey(name: string, permissions?: string[]): Promise<string>;
  validateApiKey(key: string): Promise<boolean>;

  // Profile
  avatar?: string;
  bio?: string;
  organization?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  location?: string;
  timezone?: string;

  // Authentication
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;

  // Web3
  walletAddress?: string;
  walletNonce?: string;

  // API Access
  apiKeys: {
    key: string;
    name: string;
    createdAt: Date;
    lastUsed?: Date;
    permissions: string[];
  }[];

  // Preferences
  preferences: {
    theme?: "light" | "dark" | "auto";
    language?: string;
    notifications?: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
    defaultMissionView?: string;
  };

  // Social Features
  following: string[]; // Array of user IDs
  followers: string[]; // Array of user IDs
  followingCount: number;
  followerCount: number;

  // Metadata
  permissions: string[];
  credits: number;
  subscription?: {
    plan: string;
    status: string;
    expiresAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false, // Don't include password by default
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roles: [
      {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.VIEWER,
      },
    ],

    // Profile
    avatar: String,
    bio: {
      type: String,
      maxlength: 500,
    },
    organization: String,
    department: String,
    jobTitle: String,
    phone: String,
    location: String,
    timezone: {
      type: String,
      default: "UTC",
    },

    // Authentication
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // Web3
    walletAddress: {
      type: String,
      sparse: true,
      index: true,
    },
    walletNonce: String,

    // API Keys
    apiKeys: [
      {
        key: {
          type: String,
          required: true,
        },
        name: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsed: Date,
        permissions: [String],
      },
    ],

    // Preferences
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      language: {
        type: String,
        default: "en",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        inApp: {
          type: Boolean,
          default: true,
        },
      },
      defaultMissionView: String,
    },

    // Social Features
    following: {
      type: [String],
      default: [],
    },
    followers: {
      type: [String],
      default: [],
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    followerCount: {
      type: Number,
      default: 0,
    },

    // Metadata
    permissions: [String],
    credits: {
      type: Number,
      default: 100,
    },
    subscription: {
      plan: String,
      status: String,
      expiresAt: Date,
    },

    deletedAt: Date,
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// Indexes
UserSchema.index({ email: 1, emailVerified: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ organization: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for full name
UserSchema.virtual("displayName").get(function (this: IUser) {
  return this.name || this.email.split("@")[0];
});

// Virtual for account lock status
UserSchema.virtual("isLocked").get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Methods
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.hashPassword = async function (): Promise<void> {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
};

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  } else {
    const updates: any = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
      updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
    }

    await this.updateOne(updates);
  }
};

UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

UserSchema.methods.hasRole = function (role: UserRole): boolean {
  return this.roles.includes(role);
};

UserSchema.methods.hasPermission = function (permission: string): boolean {
  // Admins have all permissions
  if (this.roles.includes(UserRole.ADMIN)) return true;

  return this.permissions.includes(permission);
};

UserSchema.methods.generateApiKey = async function (name: string, permissions: string[] = []): Promise<string> {
  const key = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;

  this.apiKeys.push({
    key: await bcrypt.hash(key, 10),
    name,
    createdAt: new Date(),
    permissions,
  });

  await this.save();
  return key;
};

UserSchema.methods.validateApiKey = async function (key: string): Promise<boolean> {
  for (const apiKey of this.apiKeys) {
    if (await bcrypt.compare(key, apiKey.key)) {
      apiKey.lastUsed = new Date();
      await this.save();
      return true;
    }
  }
  return false;
};

// Static methods
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByWallet = function (walletAddress: string) {
  return this.findOne({ walletAddress });
};

UserSchema.statics.findByApiKey = async function (key: string) {
  const users = await this.find({ "apiKeys.key": { $exists: true } });

  for (const user of users) {
    if (await user.validateApiKey(key)) {
      return user;
    }
  }

  return null;
};

UserSchema.statics.searchUsers = function (query: string) {
  return this.find({
    $or: [
      { name: new RegExp(query, "i") },
      { email: new RegExp(query, "i") },
      { organization: new RegExp(query, "i") },
    ],
  });
};

// Pre-save middleware
UserSchema.pre("save", async function (next) {
  if (!this.userId) {
    this.userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Hash password if modified
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

// Add interface for static methods
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByWallet(walletAddress: string): Promise<IUser | null>;
  findByApiKey(key: string): Promise<IUser | null>;
  searchUsers(query: string): Promise<IUser[]>;
}

// Export the model
const User = (mongoose.models.User || mongoose.model<IUser>("User", UserSchema)) as IUserModel;

export default User;
