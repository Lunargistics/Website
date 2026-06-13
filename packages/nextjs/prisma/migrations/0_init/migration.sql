-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avatar" TEXT,
    "bio" TEXT,
    "organization" TEXT,
    "department" TEXT,
    "jobTitle" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "username" TEXT,
    "usernameLower" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "lastLogin" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" TIMESTAMP(3),
    "walletAddress" TEXT,
    "walletNonce" TEXT,
    "apiKeys" JSONB NOT NULL DEFAULT '[]',
    "preferences" JSONB,
    "subscription" JSONB,
    "following" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "followers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "credits" INTEGER NOT NULL DEFAULT 100,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "owner" TEXT NOT NULL,
    "collaborators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "organization" TEXT,
    "launchDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "phases" JSONB NOT NULL DEFAULT '[]',
    "orbit" JSONB,
    "tle" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "groundStations" JSONB NOT NULL DEFAULT '[]',
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "standards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipfsHash" TEXT,
    "contractAddress" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budget" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "complianceStatus" TEXT,
    "aitPlan" TEXT,
    "lastModifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "mission" TEXT NOT NULL,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT,
    "fileUrl" TEXT,
    "ipfsHash" TEXT,
    "s3Key" TEXT,
    "metadata" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "confidentiality" TEXT NOT NULL DEFAULT 'INTERNAL',
    "authors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "approvers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviews" JSONB NOT NULL DEFAULT '[]',
    "previousVersion" TEXT,
    "nextVersion" TEXT,
    "changeLog" TEXT,
    "standards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "complianceChecks" JSONB NOT NULL DEFAULT '[]',
    "nftTokenId" TEXT,
    "contractAddress" TEXT,
    "transactionHash" TEXT,
    "owner" TEXT NOT NULL,
    "sharedWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicAccess" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "manufacturer" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "serialNumber" TEXT,
    "specifications" JSONB,
    "interfaces" JSONB NOT NULL DEFAULT '[]',
    "standards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "heritage" TEXT,
    "trl" INTEGER,
    "unitCost" DOUBLE PRECISION,
    "leadTime" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "supplier" TEXT,
    "datasheet" TEXT,
    "manuals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "testReports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nftTokenId" TEXT,
    "contractAddress" TEXT,
    "ipfsHash" TEXT,
    "compatibleWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "incompatibleWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "organization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedOutput" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "shares" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "comments" JSONB NOT NULL DEFAULT '[]',
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "missionId" TEXT,
    "metadata" JSONB,
    "result" TEXT NOT NULL,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "signature" TEXT,
    "complianceStandard" TEXT,
    "complianceStatus" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "environment" TEXT,
    "apiVersion" TEXT,
    "clientVersion" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionOwnership" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delegatedTo" JSONB NOT NULL DEFAULT '[]',
    "sharedWith" JSONB NOT NULL DEFAULT '[]',
    "transferHistory" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "MissionOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalPurchased" INTEGER NOT NULL DEFAULT 0,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "stripePaymentIntentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "stripeProductId" TEXT NOT NULL,
    "description" TEXT,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "bonusCredits" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditUsageAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "usageByEndpoint" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditUsageAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_usernameLower_key" ON "User"("usernameLower");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_organization_idx" ON "User"("organization");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_missionId_key" ON "Mission"("missionId");

-- CreateIndex
CREATE INDEX "Mission_owner_status_idx" ON "Mission"("owner", "status");

-- CreateIndex
CREATE INDEX "Mission_type_status_idx" ON "Mission"("type", "status");

-- CreateIndex
CREATE INDEX "Mission_launchDate_idx" ON "Mission"("launchDate");

-- CreateIndex
CREATE INDEX "Mission_createdAt_idx" ON "Mission"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_documentId_key" ON "Document"("documentId");

-- CreateIndex
CREATE INDEX "Document_mission_type_idx" ON "Document"("mission", "type");

-- CreateIndex
CREATE INDEX "Document_status_type_idx" ON "Document"("status", "type");

-- CreateIndex
CREATE INDEX "Document_owner_status_idx" ON "Document"("owner", "status");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE INDEX "Document_publishedAt_idx" ON "Document"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_equipmentId_key" ON "Equipment"("equipmentId");

-- CreateIndex
CREATE INDEX "Equipment_manufacturer_modelName_idx" ON "Equipment"("manufacturer", "modelName");

-- CreateIndex
CREATE INDEX "Equipment_status_category_idx" ON "Equipment"("status", "category");

-- CreateIndex
CREATE INDEX "Equipment_trl_idx" ON "Equipment"("trl");

-- CreateIndex
CREATE INDEX "Equipment_createdAt_idx" ON "Equipment"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedOutput_userId_createdAt_idx" ON "GeneratedOutput"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedOutput_userId_type_createdAt_idx" ON "GeneratedOutput"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Post_author_createdAt_idx" ON "Post"("author", "createdAt");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_auditId_key" ON "AuditLog"("auditId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_timestamp_idx" ON "AuditLog"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_severity_timestamp_idx" ON "AuditLog"("severity", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_result_timestamp_idx" ON "AuditLog"("result", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_missionId_timestamp_idx" ON "AuditLog"("missionId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MissionOwnership_missionId_key" ON "MissionOwnership"("missionId");

-- CreateIndex
CREATE INDEX "MissionOwnership_ownerId_idx" ON "MissionOwnership"("ownerId");

-- CreateIndex
CREATE INDEX "MissionOwnership_organizationId_idx" ON "MissionOwnership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditBalance_userId_key" ON "CreditBalance"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_stripePaymentIntentId_idx" ON "CreditTransaction"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPackage_stripePriceId_key" ON "CreditPackage"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditUsageAnalytics_userId_date_key" ON "CreditUsageAnalytics"("userId", "date");

