/**
 * Document Model
 * MongoDB schema for mission documents and reports
 */
import mongoose, { Model, Document as MongoDocument, Schema } from "mongoose";

export enum DocumentType {
  PDR = "PDR", // Preliminary Design Review
  CDR = "CDR", // Critical Design Review
  FRR = "FRR", // Flight Readiness Review
  ORR = "ORR", // Operational Readiness Review
  REQUIREMENTS = "REQUIREMENTS",
  COMPLIANCE_MATRIX = "COMPLIANCE_MATRIX",
  TEST_PLAN = "TEST_PLAN",
  TEST_REPORT = "TEST_REPORT",
  ICD = "ICD", // Interface Control Document
  USER_MANUAL = "USER_MANUAL",
  TECHNICAL_SPEC = "TECHNICAL_SPEC",
  RISK_ASSESSMENT = "RISK_ASSESSMENT",
  MISSION_PLAN = "MISSION_PLAN",
  SAFETY_ANALYSIS = "SAFETY_ANALYSIS",
  OTHER = "OTHER",
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  RELEASED = "RELEASED",
  OBSOLETE = "OBSOLETE",
  REJECTED = "REJECTED",
}

export interface DocumentMetadata {
  fileSize?: number; // bytes
  mimeType?: string;
  checksum?: string;
  encryptionKey?: string;
  isEncrypted?: boolean;
  compressionType?: string;
}

export interface Review {
  reviewer: mongoose.Types.ObjectId;
  reviewDate: Date;
  status: "APPROVED" | "REJECTED" | "NEEDS_REVISION";
  comments: string;
  signature?: string;
}

export interface IDocument extends MongoDocument {
  documentId: string;
  title: string;
  description: string;
  type: DocumentType;
  status: DocumentStatus;
  version: string;

  // Mission association
  mission: mongoose.Types.ObjectId;
  equipment?: mongoose.Types.ObjectId[];

  // Content storage
  content?: string; // For text/markdown documents
  fileUrl?: string; // External storage URL
  ipfsHash?: string; // IPFS storage
  s3Key?: string; // S3 storage key

  // Metadata
  metadata: DocumentMetadata;
  tags: string[];
  category?: string;
  confidentiality?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "SECRET";

  // Authors and reviewers
  authors: mongoose.Types.ObjectId[];
  reviewers: mongoose.Types.ObjectId[];
  approvers: mongoose.Types.ObjectId[];
  reviews: Review[];

  // Versioning
  previousVersion?: mongoose.Types.ObjectId;
  nextVersion?: mongoose.Types.ObjectId;
  changeLog?: string;

  // Standards compliance
  standards: string[];
  complianceChecks?: {
    standard: string;
    status: "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL";
    notes: string;
  }[];

  // Blockchain
  nftTokenId?: string;
  contractAddress?: string;
  transactionHash?: string;

  // Access control
  owner: mongoose.Types.ObjectId;
  sharedWith: mongoose.Types.ObjectId[];
  publicAccess: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.DRAFT,
      required: true,
      index: true,
    },
    version: {
      type: String,
      default: "1.0.0",
      required: true,
    },

    // Mission association
    mission: {
      type: Schema.Types.ObjectId,
      ref: "Mission",
      required: true,
      index: true,
    },
    equipment: [
      {
        type: Schema.Types.ObjectId,
        ref: "Equipment",
      },
    ],

    // Content storage
    content: {
      type: String,
      maxlength: 1000000, // ~1MB for text content
    },
    fileUrl: String,
    ipfsHash: {
      type: String,
      index: true,
    },
    s3Key: String,

    // Metadata
    metadata: {
      fileSize: Number,
      mimeType: String,
      checksum: String,
      encryptionKey: String,
      isEncrypted: Boolean,
      compressionType: String,
    },
    tags: [String],
    category: String,
    confidentiality: {
      type: String,
      enum: ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SECRET"],
      default: "INTERNAL",
    },

    // People
    authors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    reviewers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    approvers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reviews: [
      {
        reviewer: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        reviewDate: Date,
        status: {
          type: String,
          enum: ["APPROVED", "REJECTED", "NEEDS_REVISION"],
        },
        comments: String,
        signature: String,
      },
    ],

    // Versioning
    previousVersion: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    nextVersion: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    changeLog: String,

    // Standards
    standards: [String],
    complianceChecks: [
      {
        standard: String,
        status: {
          type: String,
          enum: ["COMPLIANT", "NON_COMPLIANT", "PARTIAL"],
        },
        notes: String,
      },
    ],

    // Blockchain
    nftTokenId: String,
    contractAddress: String,
    transactionHash: String,

    // Access
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sharedWith: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    publicAccess: {
      type: Boolean,
      default: false,
    },

    // Timestamps
    publishedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
    collection: "documents",
  },
);

// Indexes
DocumentSchema.index({ mission: 1, type: 1 });
DocumentSchema.index({ status: 1, type: 1 });
DocumentSchema.index({ tags: 1 });
DocumentSchema.index({ owner: 1, status: 1 });
DocumentSchema.index({ createdAt: -1 });
DocumentSchema.index({ publishedAt: -1 });

// Virtual for access check
DocumentSchema.virtual("hasAccess").get(function (this: IDocument) {
  return function (userId: string) {
    return (
      this.publicAccess ||
      this.owner.toString() === userId ||
      this.sharedWith.some(u => u.toString() === userId) ||
      this.authors.some(a => a.toString() === userId)
    );
  };
});

// Methods
DocumentSchema.methods.addReview = async function (
  reviewerId: mongoose.Types.ObjectId,
  status: "APPROVED" | "REJECTED" | "NEEDS_REVISION",
  comments: string,
  signature?: string,
) {
  this.reviews.push({
    reviewer: reviewerId,
    reviewDate: new Date(),
    status,
    comments,
    signature,
  });

  if (
    status === "APPROVED" &&
    this.reviewers.every(r =>
      this.reviews.some(rev => rev.reviewer.toString() === r.toString() && rev.status === "APPROVED"),
    )
  ) {
    this.status = DocumentStatus.APPROVED;
  } else if (status === "REJECTED") {
    this.status = DocumentStatus.REJECTED;
  }

  await this.save();
};

DocumentSchema.methods.publish = async function () {
  if (this.status !== DocumentStatus.APPROVED) {
    throw new Error("Document must be approved before publishing");
  }

  this.status = DocumentStatus.RELEASED;
  this.publishedAt = new Date();
  await this.save();
};

DocumentSchema.methods.createNewVersion = async function (
  userId: mongoose.Types.ObjectId,
  changes: Partial<IDocument>,
): Promise<IDocument> {
  const newVersion = new (mongoose.model("Document"))<IDocument>({
    ...this.toObject(),
    ...changes,
    _id: undefined,
    documentId: undefined,
    version: this.incrementVersion(),
    previousVersion: this._id,
    status: DocumentStatus.DRAFT,
    reviews: [],
    createdAt: undefined,
    updatedAt: undefined,
  });

  await newVersion.save();

  this.nextVersion = newVersion._id;
  await this.save();

  return newVersion;
};

DocumentSchema.methods.incrementVersion = function (): string {
  const parts = this.version.split(".");
  parts[2] = (parseInt(parts[2]) + 1).toString();
  return parts.join(".");
};

// Static methods
DocumentSchema.statics.findByMission = function (missionId: mongoose.Types.ObjectId) {
  return this.find({ mission: missionId }).sort({ createdAt: -1 });
};

DocumentSchema.statics.findByType = function (type: DocumentType) {
  return this.find({ type, status: DocumentStatus.RELEASED });
};

DocumentSchema.statics.findPendingReview = function (reviewerId: mongoose.Types.ObjectId) {
  return this.find({
    reviewers: reviewerId,
    status: DocumentStatus.UNDER_REVIEW,
    "reviews.reviewer": { $ne: reviewerId },
  });
};

// Pre-save middleware
DocumentSchema.pre("save", function (next) {
  if (!this.documentId) {
    this.documentId = `DOC-${this.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Add interface for static methods
interface IDocumentModel extends Model<IDocument> {
  findByMission(missionId: mongoose.Types.ObjectId): Promise<IDocument[]>;
  findByType(type: DocumentType): Promise<IDocument[]>;
  findPendingReview(reviewerId: mongoose.Types.ObjectId): Promise<IDocument[]>;
}

// Export the model
const Document = (mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema)) as IDocumentModel;

export default Document;
