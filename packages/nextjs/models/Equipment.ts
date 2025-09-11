/**
 * Equipment Model
 * MongoDB schema for space equipment and components
 */
import mongoose, { Document, Model, Schema } from "mongoose";

export enum EquipmentCategory {
  SATELLITE_BUS = "SATELLITE_BUS",
  PAYLOAD = "PAYLOAD",
  POWER_SYSTEM = "POWER_SYSTEM",
  COMMUNICATION = "COMMUNICATION",
  PROPULSION = "PROPULSION",
  ATTITUDE_CONTROL = "ATTITUDE_CONTROL",
  THERMAL_CONTROL = "THERMAL_CONTROL",
  GROUND_SUPPORT = "GROUND_SUPPORT",
  SOFTWARE = "SOFTWARE",
  TEST_EQUIPMENT = "TEST_EQUIPMENT",
}

export enum EquipmentStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
  RETIRED = "RETIRED",
  PROTOTYPE = "PROTOTYPE",
  FLIGHT_QUALIFIED = "FLIGHT_QUALIFIED",
}

export interface TechnicalSpecs {
  mass?: number; // kg
  power?: number; // watts
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  operatingTemp?: {
    min: number;
    max: number;
    unit: string;
  };
  dataRate?: number; // Mbps
  frequency?: number; // MHz/GHz
  voltage?: number; // V
  current?: number; // A
  [key: string]: any;
}

export interface InterfaceSpec {
  name: string;
  type: string; // electrical, mechanical, data, thermal
  protocol?: string;
  connector?: string;
  pinout?: string[];
  dataFormat?: string;
}

export interface IEquipment extends Document {
  equipmentId: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  manufacturer: string;
  modelName: string;
  serialNumber?: string;

  // Technical specifications
  specifications: TechnicalSpecs;
  interfaces: InterfaceSpec[];

  // Standards and compliance
  standards: string[];
  certifications: string[];
  heritage?: string; // Previous missions/usage
  trl?: number; // Technology Readiness Level (1-9)

  // Cost and availability
  unitCost?: number;
  leadTime?: number; // days
  quantity?: number;
  supplier?: string;

  // Documentation
  datasheet?: string; // URL or IPFS hash
  manuals?: string[];
  testReports?: string[];
  images?: string[];

  // NFT/Blockchain
  nftTokenId?: string;
  contractAddress?: string;
  ipfsHash?: string;

  // Relationships
  compatibleWith: mongoose.Types.ObjectId[];
  incompatibleWith: mongoose.Types.ObjectId[];
  missions: mongoose.Types.ObjectId[];

  // Metadata
  tags: string[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  organization?: string;

  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    equipmentId: {
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
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: Object.values(EquipmentCategory),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EquipmentStatus),
      default: EquipmentStatus.AVAILABLE,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    modelName: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      sparse: true,
      index: true,
    },

    // Technical specs
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    interfaces: [
      {
        name: String,
        type: String,
        protocol: String,
        connector: String,
        pinout: [String],
        dataFormat: String,
      },
    ],

    // Standards
    standards: [String],
    certifications: [String],
    heritage: String,
    trl: {
      type: Number,
      min: 1,
      max: 9,
    },

    // Cost
    unitCost: Number,
    leadTime: Number,
    quantity: {
      type: Number,
      default: 1,
    },
    supplier: String,

    // Documentation
    datasheet: String,
    manuals: [String],
    testReports: [String],
    images: [String],

    // Blockchain
    nftTokenId: String,
    contractAddress: String,
    ipfsHash: String,

    // Relationships
    compatibleWith: [
      {
        type: Schema.Types.ObjectId,
        ref: "Equipment",
      },
    ],
    incompatibleWith: [
      {
        type: Schema.Types.ObjectId,
        ref: "Equipment",
      },
    ],
    missions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Mission",
      },
    ],

    // Metadata
    tags: [String],
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: String,
  },
  {
    timestamps: true,
    collection: "equipment",
  },
);

// Indexes
EquipmentSchema.index({ manufacturer: 1, modelName: 1 });
EquipmentSchema.index({ tags: 1 });
EquipmentSchema.index({ status: 1, category: 1 });
EquipmentSchema.index({ trl: 1 });
EquipmentSchema.index({ createdAt: -1 });

// Virtual for compatibility check
EquipmentSchema.virtual("isCompatibleWith").get(function (this: IEquipment) {
  return function (equipmentId: mongoose.Types.ObjectId) {
    return this.compatibleWith.includes(equipmentId) && !this.incompatibleWith.includes(equipmentId);
  };
});

// Methods
EquipmentSchema.methods.checkCompatibility = function (otherEquipment: IEquipment): {
  compatible: boolean;
  reason?: string;
} {
  if (this.incompatibleWith.includes(otherEquipment._id)) {
    return { compatible: false, reason: "Explicitly marked as incompatible" };
  }

  // Check interface compatibility
  const commonInterfaces = this.interfaces.filter(i1 =>
    otherEquipment.interfaces.some(i2 => i1.type === i2.type && i1.protocol === i2.protocol),
  );

  if (commonInterfaces.length === 0) {
    return { compatible: false, reason: "No compatible interfaces found" };
  }

  return { compatible: true };
};

EquipmentSchema.methods.assignToMission = async function (missionId: mongoose.Types.ObjectId) {
  if (!this.missions.includes(missionId)) {
    this.missions.push(missionId);
    this.status = EquipmentStatus.IN_USE;
    await this.save();
  }
};

EquipmentSchema.methods.removeFromMission = async function (missionId: mongoose.Types.ObjectId) {
  this.missions = this.missions.filter(m => m.toString() !== missionId.toString());
  if (this.missions.length === 0) {
    this.status = EquipmentStatus.AVAILABLE;
  }
  await this.save();
};

// Static methods
EquipmentSchema.statics.findByCategory = function (category: EquipmentCategory) {
  return this.find({ category, status: EquipmentStatus.AVAILABLE });
};

EquipmentSchema.statics.findCompatible = async function (equipmentId: mongoose.Types.ObjectId) {
  const equipment = await this.findById(equipmentId);
  if (!equipment) return [];

  return this.find({
    _id: { $in: equipment.compatibleWith },
    status: EquipmentStatus.AVAILABLE,
  });
};

EquipmentSchema.statics.searchBySpecs = function (specs: Partial<TechnicalSpecs>) {
  const query: any = {};

  if (specs.mass) {
    query["specifications.mass"] = { $lte: specs.mass };
  }
  if (specs.power) {
    query["specifications.power"] = { $lte: specs.power };
  }

  return this.find(query);
};

// Pre-save middleware
EquipmentSchema.pre("save", function (next) {
  if (!this.equipmentId) {
    this.equipmentId = `EQP-${this.category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Export the model
const Equipment: Model<IEquipment> =
  mongoose.models.Equipment || mongoose.model<IEquipment>("Equipment", EquipmentSchema);

export default Equipment;
