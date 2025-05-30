export enum UserActivityType {
  ROCKET_LAUNCH = "Rocket Launch",
  SATELLITE_DEPLOYMENT = "Satellite Deployment",
  EXPLORATION_MISSION = "Exploration Mission",
  RESEARCH_PROJECT = "Research Project",
  SPACE_TOURISM = "Space Tourism",
  MANUFACTURING = "In-Space Manufacturing",
  RESOURCE_EXTRACTION = "Resource Extraction",
  OTHER = "Other",
}

export enum UserActivityStatus {
  PLANNED = "Planned",
  PREPARATION = "Preparation",
  IN_PROGRESS = "In Progress",
  COMPLETED_SUCCESS = "Completed - Success",
  COMPLETED_FAILURE = "Completed - Failure",
  COMPLETED_PARTIAL_SUCCESS = "Completed - Partial Success",
  ON_HOLD = "On Hold",
  CANCELLED = "Cancelled",
}

export enum ComplianceStatus {
  PENDING_SUBMISSION = "Pending Submission",
  PENDING_REVIEW = "Pending Review",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  ACTION_REQUIRED = "Action Required",
  EXPIRED = "Expired",
  NOT_APPLICABLE = "Not Applicable",
}

export interface ComplianceDocument {
  id: string; // Will store bytes32 hex string from contract
  documentName: string;
  documentType: string; // e.g., Launch License, Safety Approval, Environmental Impact Assessment, ITU Filing
  documentHashOrLink: string; // Could be IPFS hash, URL, or internal reference
  status: ComplianceStatus;
  submittedDate?: string; // ISO date string
  reviewDate?: string; // ISO date string
  expiryDate?: string; // ISO date string
  notes?: string;
  responsibleEntity?: string; // Who is responsible for this document
}

export interface UserActivity {
  id: string; // Will store bytes32 hex string from contract (e.g., Hex from viem)
  owner?: string; // Address (Hex string), added field
  type: UserActivityType;
  name: string;
  description: string;
  organization?: string; // Responsible organization
  projectManager?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  launchDateTime?: string; // ISO datetime string, if applicable
  status: UserActivityStatus;

  // For linking to external API data if applicable
  externalApiLaunchId?: string;
  externalApiSource?: "general" | "spacex";

  // Location specific fields (could be complex, simplified for now)
  launchSite?: string;
  destination?: string; // e.g., LEO, Moon, Mars, Specific Orbit

  payloadDetails?: string; // Description of payload

  complianceDocuments: ComplianceDocument[];
  overallComplianceSummary?: string; // Text summary of compliance state

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
