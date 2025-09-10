import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  usernameLower: string;
  password: string;
  name?: string;
  bio?: string;
  avatar?: string;
  walletAddress?: string;
  followers: string[];
  following: string[];
  followerCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be less than 30 characters'],
    },
    usernameLower: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [12, 'Password must be at least 12 characters'],
      validate: {
        validator: function(password: string) {
          // Check for at least one uppercase letter
          if (!/[A-Z]/.test(password)) return false;
          // Check for at least one lowercase letter
          if (!/[a-z]/.test(password)) return false;
          // Check for at least one number
          if (!/[0-9]/.test(password)) return false;
          // Check for at least one special character (safe ones that won't cause scripting issues)
          if (!/[!@#$%^&*()_+=\[\]{};':",.<>?/|\\-]/.test(password)) return false;
          return true;
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }
    },
    name: {
      type: String,
      maxlength: [100, 'Name must be less than 100 characters'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio must be less than 500 characters'],
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
    followers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
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
  }
);

// Set usernameLower before validation
UserSchema.pre('validate', function(next) {
  if (this.username) {
    this.usernameLower = this.username.toLowerCase();
  }
  next();
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
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
UserSchema.pre('save', function(next) {
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

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;