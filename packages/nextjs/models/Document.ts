/**
 * Document domain types.
 *
 * Migrated from Mongoose to Prisma + Postgres. This file no longer defines a
 * Mongoose schema/model; it only exports the shared enums and plain data shapes.
 * Persistence goes through the shared Prisma client (`prisma.document`), and the
 * former instance/static methods now live in `services/database/dataService.ts`.
 */

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
  reviewer: string;
  reviewDate: Date;
  status: "APPROVED" | "REJECTED" | "NEEDS_REVISION";
  comments: string;
  signature?: string;
}

export interface ComplianceCheck {
  standard: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL";
  notes: string;
}

export interface IDocument {
  id: string;
  documentId: string;
  title: string;
  description: string;
  type: DocumentType;
  status: DocumentStatus;
  version: string;

  // Mission association
  mission: string;
  equipment?: string[];

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
  authors: string[];
  reviewers: string[];
  approvers: string[];
  reviews: Review[];

  // Versioning
  previousVersion?: string;
  nextVersion?: string;
  changeLog?: string;

  // Standards compliance
  standards: string[];
  complianceChecks?: ComplianceCheck[];

  // Blockchain
  nftTokenId?: string;
  contractAddress?: string;
  transactionHash?: string;

  // Access control
  owner: string;
  sharedWith: string[];
  publicAccess: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
}
