/**
 * Mission Model
 * MongoDB schema for space missions
 */
import mongoose, { Document, Model, Schema } from "mongoose";

export enum MissionStatus {
  DRAFT = "DRAFT",
  PLANNING = "PLANNING",
  IN_DEVELOPMENT = "IN_DEVELOPMENT",
  TESTING = "TESTING",
  READY_FOR_LAUNCH = "READY_FOR_LAUNCH",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum MissionType {
  EARTH_OBSERVATION = "EARTH_OBSERVATION",
  COMMUNICATIONS = "COMMUNICATIONS",
  SCIENCE = "SCIENCE",
  TECHNOLOGY_DEMO = "TECHNOLOGY_DEMO",
  NAVIGATION = "NAVIGATION",
  SPACE_EXPLORATION = "SPACE_EXPLORATION",
  COMMERCIAL = "COMMERCIAL",
}

export interface OrbitalElements {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  rightAscension: number;
  argumentOfPerigee: number;
  trueAnomaly: number;
  epoch: Date;
}

export interface GroundStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  minElevationAngle?: number;
  active: boolean;
}

export interface MissionPhase {
  name: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  description: string;
  milestones: string[];
  risks: string[];
}

export interface IMission extends Document {
  missionId: string;
  name: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  owner: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  organization?: string;

  // Mission timeline
  launchDate?: Date;
  endDate?: Date;
  phases: MissionPhase[];

  // Orbital parameters
  orbit?: OrbitalElements;
  tle?: string[];
  groundStations: GroundStation[];

  // Equipment and requirements
  equipment: mongoose.Types.ObjectId[];
  requirements: mongoose.Types.ObjectId[];
  standards: string[];

  // Documentation
  documents: mongoose.Types.ObjectId[];
  ipfsHash?: string;
  contractAddress?: string;

  // Metadata
  tags: string[];
  budget?: number;
  riskLevel?: string;
  complianceStatus?: string;
  aitPlan?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: mongoose.Types.ObjectId;
}

const MissionSchema = new Schema<IMission>(
  {
    missionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: Object.values(MissionType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MissionStatus),
      default: MissionStatus.DRAFT,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    organization: {
      type: String,
      trim: true,
    },

    // Timeline
    launchDate: Date,
    endDate: Date,
    phases: [
      {
        name: String,
        startDate: Date,
        endDate: Date,
        status: String,
        description: String,
        milestones: [String],
        risks: [String],
      },
    ],

    // Orbital parameters
    orbit: {
      semiMajorAxis: Number,
      eccentricity: Number,
      inclination: Number,
      rightAscension: Number,
      argumentOfPerigee: Number,
      trueAnomaly: Number,
      epoch: Date,
    },
    tle: [String],
    groundStations: [
      {
        id: String,
        name: String,
        latitude: Number,
        longitude: Number,
        elevation: Number,
        minElevationAngle: Number,
        active: Boolean,
      },
    ],

    // References
    equipment: [
      {
        type: Schema.Types.ObjectId,
        ref: "Equipment",
      },
    ],
    requirements: [
      {
        type: Schema.Types.ObjectId,
        ref: "Requirement",
      },
    ],
    standards: [String],
    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],

    // Blockchain/IPFS
    ipfsHash: String,
    contractAddress: String,

    // Metadata
    tags: [String],
    budget: Number,
    riskLevel: String,
    complianceStatus: String,
    aitPlan: {
      type: Schema.Types.ObjectId,
      ref: "AITPlan",
    },

    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "missions",
  },
);

// Indexes for performance
MissionSchema.index({ owner: 1, status: 1 });
MissionSchema.index({ collaborators: 1 });
MissionSchema.index({ tags: 1 });
MissionSchema.index({ type: 1, status: 1 });
MissionSchema.index({ launchDate: 1 });
MissionSchema.index({ createdAt: -1 });

// Virtual for access check
MissionSchema.virtual("hasAccess").get(function (this: IMission) {
  return function (userId: string) {
    return this.owner.toString() === userId || this.collaborators.some(c => c.toString() === userId);
  };
});

// Methods
MissionSchema.methods.addCollaborator = async function (userId: mongoose.Types.ObjectId) {
  if (!this.collaborators.includes(userId)) {
    this.collaborators.push(userId);
    await this.save();
  }
};

MissionSchema.methods.removeCollaborator = async function (userId: mongoose.Types.ObjectId) {
  this.collaborators = this.collaborators.filter(c => c.toString() !== userId.toString());
  await this.save();
};

MissionSchema.methods.updateStatus = async function (newStatus: MissionStatus, userId: mongoose.Types.ObjectId) {
  this.status = newStatus;
  this.lastModifiedBy = userId;

  if (newStatus === MissionStatus.COMPLETED) {
    this.endDate = new Date();
  }

  await this.save();
};

// Static methods
MissionSchema.statics.findByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({
    $or: [{ owner: userId }, { collaborators: userId }],
  });
};

MissionSchema.statics.findActive = function () {
  return this.find({
    status: { $in: [MissionStatus.ACTIVE, MissionStatus.READY_FOR_LAUNCH] },
  });
};

// Pre-save middleware
MissionSchema.pre("save", function (next) {
  if (!this.missionId) {
    this.missionId = `MISSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Add interface for static methods
interface IMissionModel extends Model<IMission> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<IMission[]>;
  findActive(): Promise<IMission[]>;
}

// Export the model
const Mission = (mongoose.models.Mission || mongoose.model<IMission>("Mission", MissionSchema)) as IMissionModel;

export default Mission;
