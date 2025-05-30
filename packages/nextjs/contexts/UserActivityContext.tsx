"use client";

import React, { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { Hex } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import {
  useScaffoldEventHistory,
  useScaffoldWatchContractEvent,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";
import {
  initializeEAS, // createAttestation, // To be used when robust ID retrieval is implemented
  // ACTIVITY_LOGGED_SCHEMA_UID, // For attestActivityLogged
  // ACTIVITY_LOGGED_SCHEMA_STRING,
  // COMPLIANCE_DOC_ADDED_SCHEMA_UID, // For attestComplianceDocAdded
  // COMPLIANCE_DOC_ADDED_SCHEMA_STRING,
  // COMPLIANCE_DOC_STATUS_UPDATED_SCHEMA_UID, // For attestComplianceDocStatusUpdated
  // COMPLIANCE_DOC_STATUS_UPDATED_SCHEMA_STRING,
} from "~~/services/easService";
import {
  ComplianceDocument,
  ComplianceStatus,
  UserActivity,
  UserActivityStatus,
  UserActivityType,
} from "~~/types/lunargistics";
import { notification } from "~~/utils/scaffold-eth";
import { ContractName } from "~~/utils/scaffold-eth/contract";

// Helper functions & Enums (as before)
const dateToTimestamp = (dateStr: string | undefined): bigint => {
  if (!dateStr) return 0n;
  return BigInt(Math.floor(new Date(dateStr).getTime() / 1000));
};
const activityTypeToUint = (type: UserActivityType): number => {
  // Using Record to avoid ESLint unused variable warning for the mapped type key
  const mapping: Record<UserActivityType, number> = {
    [UserActivityType.ROCKET_LAUNCH]: 0,
    [UserActivityType.SATELLITE_DEPLOYMENT]: 1,
    [UserActivityType.EXPLORATION_MISSION]: 2,
    [UserActivityType.RESEARCH_PROJECT]: 3,
    [UserActivityType.SPACE_TOURISM]: 4,
    [UserActivityType.MANUFACTURING]: 5,
    [UserActivityType.RESOURCE_EXTRACTION]: 6,
    [UserActivityType.OTHER]: 7,
  };
  return mapping[type];
};
const activityStatusToUint = (status: UserActivityStatus): number => {
  // Using Record to avoid ESLint unused variable warning for the mapped type key
  const mapping: Record<UserActivityStatus, number> = {
    [UserActivityStatus.PLANNED]: 0,
    [UserActivityStatus.PREPARATION]: 1,
    [UserActivityStatus.IN_PROGRESS]: 2,
    [UserActivityStatus.COMPLETED_SUCCESS]: 3,
    [UserActivityStatus.COMPLETED_FAILURE]: 4,
    [UserActivityStatus.COMPLETED_PARTIAL_SUCCESS]: 5,
    [UserActivityStatus.ON_HOLD]: 6,
    [UserActivityStatus.CANCELLED]: 7,
  };
  return mapping[status];
};
const complianceStatusToUint = (status: ComplianceStatus): number => {
  // Using Record to avoid ESLint unused variable warning for the mapped type key
  const mapping: Record<ComplianceStatus, number> = {
    [ComplianceStatus.PENDING_SUBMISSION]: 0,
    [ComplianceStatus.PENDING_REVIEW]: 1,
    [ComplianceStatus.APPROVED]: 2,
    [ComplianceStatus.REJECTED]: 3,
    [ComplianceStatus.ACTION_REQUIRED]: 4,
    [ComplianceStatus.EXPIRED]: 5,
    [ComplianceStatus.NOT_APPLICABLE]: 6,
  };
  return mapping[status];
};
const mapActivityTypeFromUint = (typeInt: number): UserActivityType => {
  // Using Record to avoid ESLint unused variable warning for the mapped type key
  const mapping: Record<number, UserActivityType> = {
    0: UserActivityType.ROCKET_LAUNCH,
    1: UserActivityType.SATELLITE_DEPLOYMENT,
    2: UserActivityType.EXPLORATION_MISSION,
    3: UserActivityType.RESEARCH_PROJECT,
    4: UserActivityType.SPACE_TOURISM,
    5: UserActivityType.MANUFACTURING,
    6: UserActivityType.RESOURCE_EXTRACTION,
    7: UserActivityType.OTHER,
  };
  return mapping[typeInt] || UserActivityType.OTHER;
};
const mapActivityStatusFromUint = (statusInt: number): UserActivityStatus => {
  // Using Record to avoid ESLint unused variable warning for the mapped type key
  const mapping: Record<number, UserActivityStatus> = {
    0: UserActivityStatus.PLANNED,
    1: UserActivityStatus.PREPARATION,
    2: UserActivityStatus.IN_PROGRESS,
    3: UserActivityStatus.COMPLETED_SUCCESS,
    4: UserActivityStatus.COMPLETED_FAILURE,
    5: UserActivityStatus.COMPLETED_PARTIAL_SUCCESS,
    6: UserActivityStatus.ON_HOLD,
    7: UserActivityStatus.CANCELLED,
  };
  return mapping[statusInt] || UserActivityStatus.PLANNED;
};
const mapComplianceStatusFromUint = (statusInt: number): ComplianceStatus => {
  // Using Record to avoid ESLint unused variable warning for the mapped type key
  const mapping: Record<number, ComplianceStatus> = {
    0: ComplianceStatus.PENDING_SUBMISSION,
    1: ComplianceStatus.PENDING_REVIEW,
    2: ComplianceStatus.APPROVED,
    3: ComplianceStatus.REJECTED,
    4: ComplianceStatus.ACTION_REQUIRED,
    5: ComplianceStatus.EXPIRED,
    6: ComplianceStatus.NOT_APPLICABLE,
  };
  return mapping[statusInt] || ComplianceStatus.NOT_APPLICABLE;
};

interface UserActivityContextType {
  activities: UserActivity[];
  isLoadingActivities: boolean;
  addActivity: (
    activityData: Omit<UserActivity, "id" | "createdAt" | "updatedAt" | "complianceDocuments" | "owner">,
  ) => Promise<void>;
  updateActivity: (
    id: Hex,
    updates: Partial<Omit<UserActivity, "id" | "createdAt" | "updatedAt" | "owner" | "complianceDocuments">>,
  ) => Promise<void>;
  getActivityByIdFromState: (id: Hex) => UserActivity | undefined;
  addComplianceDocument: (activityId: Hex, docData: Omit<ComplianceDocument, "id">) => Promise<void>;
  updateComplianceDocumentStatus: (
    activityId: Hex,
    docId: Hex,
    newStatus: ComplianceStatus,
    reviewDate?: string,
  ) => Promise<void>;
  /**
   * Manually trigger a re-fetch of activities from the contract/event logs.
   * Returned from the underlying event history hooks.
   */
  refetchActivities?: () => Promise<void>;
}

const UserActivityContext = createContext<UserActivityContextType | undefined>(undefined);
const CONTRACT_NAME_SAM: ContractName = "SpaceActivityManager";

const processActivityLoggedEvent = (log: any): UserActivity => {
  const args = log.args;
  // Basic mapping from event; full details might need a separate fetch if not all in event
  return {
    id: args.activityId as Hex,
    owner: args.owner as Hex,
    name: args.name,
    type: mapActivityTypeFromUint(Number(args.activityType)),
    description: "", // Event doesn't contain full description
    organization: "", // Event doesn't contain organization
    projectManager: "",
    startDate: undefined, // Event doesn't contain startDate
    endDate: undefined,
    launchDateTime: undefined,
    status: UserActivityStatus.PLANNED, // Corrected: Use UserActivityStatus enum
    externalApiLaunchId: "",
    externalApiSource: undefined,
    launchSite: "",
    destination: "",
    payloadDetails: "",
    complianceDocuments: [], // Compliance docs are managed by other events
    createdAt: new Date(Number(args.createdAt) * 1000).toISOString(),
    updatedAt: new Date(Number(args.createdAt) * 1000).toISOString(),
  };
};

export const UserActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const { address: connectedAddress, chainId: connectedChainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { writeContractAsync: writeSAMAsync } = useScaffoldWriteContract(CONTRACT_NAME_SAM);

  // Initialize EAS when wallet client becomes available
  useEffect(() => {
    if (walletClient && connectedChainId) {
      initializeEAS(walletClient, connectedChainId);
    }
  }, [walletClient, connectedChainId]);

  // Fetch historical ActivityLogged events
  const {
    data: activityLoggedHistory,
    isLoading: isLoadingLoggedHistory,
    refetch: refetchActivityLoggedHistory,
  } = useScaffoldEventHistory({
    contractName: CONTRACT_NAME_SAM,
    eventName: "ActivityLogged",
    fromBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || "0"),
    watch: false, // Fetch once
  });

  // Fetch historical ActivityUpdated events (to apply on top of logged)
  const {
    data: activityUpdatedHistory,
    isLoading: isLoadingUpdatedHistory,
    refetch: refetchActivityUpdatedHistory,
  } = useScaffoldEventHistory({
    contractName: CONTRACT_NAME_SAM,
    eventName: "ActivityUpdated",
    fromBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || "0"),
    watch: false,
  });

  useEffect(() => {
    setIsLoadingActivities(isLoadingLoggedHistory || isLoadingUpdatedHistory);
    if (!isLoadingLoggedHistory && !isLoadingUpdatedHistory) {
      if (activityLoggedHistory) {
        const baseActivities = activityLoggedHistory.map(log => processActivityLoggedEvent(log as any));
        const activityMap = new Map(baseActivities.map(act => [act.id, act]));

        // Apply updates from history
        if (activityUpdatedHistory) {
          activityUpdatedHistory.forEach(log => {
            const args = (log as any).args;
            const existingActivity = activityMap.get(args.activityId as Hex);
            if (existingActivity) {
              // Note: ActivityUpdated event only has newStatus and updater.
              // For full detail update, the event would need to emit more fields,
              // or we'd need to fetch the full activity details after this event.
              // For now, we only update what's in the event (status and updatedAt).
              activityMap.set(args.activityId as Hex, {
                ...existingActivity,
                status: mapActivityStatusFromUint(Number(args.newStatus)),
                updatedAt: new Date(Number(args.updatedAt) * 1000).toISOString(),
                // To get full updates like name, desc etc., the ActivityUpdated event needs to emit them
                // OR we refetch activity details for args.activityId here.
                // This simplified version only updates status and timestamp from this event.
              });
            }
          });
        }
        setActivities(
          Array.from(activityMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      } else {
        setActivities([]);
      }
    }
  }, [activityLoggedHistory, isLoadingLoggedHistory, activityUpdatedHistory, isLoadingUpdatedHistory]);

  // Watch for new ActivityLogged events
  useScaffoldWatchContractEvent({
    contractName: CONTRACT_NAME_SAM,
    eventName: "ActivityLogged",
    onLogs: logs => {
      logs.forEach(log => {
        const newActivity = processActivityLoggedEvent(log as any);
        setActivities(prev => {
          if (prev.find(a => a.id === newActivity.id)) return prev; // Avoid duplicates
          return [...prev, newActivity].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        });
        notification.success(`New Activity Logged: ${newActivity.name}`);
      });
    },
  });

  // Watch for new ActivityUpdated events
  useScaffoldWatchContractEvent({
    contractName: CONTRACT_NAME_SAM,
    eventName: "ActivityUpdated",
    onLogs: logs => {
      logs.forEach(log => {
        const args = (log as any).args;
        setActivities(prev =>
          prev.map(act =>
            act.id === (args.activityId as Hex)
              ? {
                  ...act,
                  status: mapActivityStatusFromUint(Number(args.newStatus)),
                  updatedAt: new Date(Number(args.updatedAt) * 1000).toISOString(),
                  // If ActivityUpdated emitted more fields, update them here too.
                  // E.g. name: args.name (if event had it)
                }
              : act,
          ),
        );
        notification.info(`Activity ${args.activityId.substring(0, 8)}... updated.`);
      });
    },
  });

  // Watch for new ComplianceDocumentAdded events
  useScaffoldWatchContractEvent({
    contractName: CONTRACT_NAME_SAM,
    eventName: "ComplianceDocumentAdded",
    onLogs: logs => {
      logs.forEach(log => {
        const args = (log as any).args;
        const actId = args.activityId as Hex;
        const docId = args.documentId as Hex;
        const statusEnum = mapComplianceStatusFromUint(Number(args.status));
        setActivities(prev =>
          prev.map(act => {
            if (act.id !== actId) return act;
            // avoid duplicate doc
            if (act.complianceDocuments.some(d => d.id === docId)) return act;
            return {
              ...act,
              complianceDocuments: [
                ...act.complianceDocuments,
                {
                  id: docId,
                  documentName: args.documentName,
                  documentType: "",
                  documentHashOrLink: "",
                  status: statusEnum,
                  // submittedDate will be filled when activity refetched
                },
              ],
              updatedAt: new Date().toISOString(),
            };
          }),
        );
        notification.success(`Document "${args.documentName}" added to activity ${actId.substring(0, 8)}...`);
      });
    },
  });

  // Watch for ComplianceDocumentUpdated events
  useScaffoldWatchContractEvent({
    contractName: CONTRACT_NAME_SAM,
    eventName: "ComplianceDocumentUpdated",
    onLogs: logs => {
      logs.forEach(log => {
        const args = (log as any).args;
        const actId = args.activityId as Hex;
        const docId = args.documentId as Hex;
        const newStatus = mapComplianceStatusFromUint(Number(args.newStatus));
        setActivities(prev =>
          prev.map(act => {
            if (act.id !== actId) return act;
            return {
              ...act,
              complianceDocuments: act.complianceDocuments.map(doc =>
                doc.id === docId ? { ...doc, status: newStatus } : doc,
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        );
        notification.info(`Document status updated for activity ${actId.substring(0, 8)}...`);
      });
    },
  });

  // Manual refetch helper
  const refetchActivities = useCallback(async () => {
    await Promise.all([refetchActivityLoggedHistory(), refetchActivityUpdatedHistory()]);
  }, [refetchActivityLoggedHistory, refetchActivityUpdatedHistory]);

  const addActivity = async (
    activityData: Omit<UserActivity, "id" | "createdAt" | "updatedAt" | "complianceDocuments" | "owner">,
  ): Promise<void> => {
    if (!connectedAddress || !connectedChainId) {
      notification.error("Please connect your wallet to log an activity.");
      return;
    }
    // let activityIdContract: Hex | undefined = undefined; // This would be assigned after tx confirmation + log parsing
    try {
      await writeSAMAsync({
        functionName: "logActivity",
        args: [
          activityTypeToUint(activityData.type),
          activityData.name,
          activityData.description,
          activityData.organization || "",
          activityData.projectManager || "",
          dateToTimestamp(activityData.startDate),
          dateToTimestamp(activityData.endDate),
          dateToTimestamp(activityData.launchDateTime),
          activityStatusToUint(activityData.status),
          activityData.externalApiLaunchId || "",
          activityData.externalApiSource || "",
          activityData.launchSite || "",
          activityData.destination || "",
          activityData.payloadDetails || "",
        ],
      });
      notification.info("Activity creation transaction submitted.");
      // We need to get the activityId from the event to make an attestation.
      // This requires waiting for the transaction to be mined and then finding the event.
      // For simplicity, we'll assume the ActivityLogged event watcher in this context updates the state soon enough,
      // OR we enhance writeSAMAsync to return parsed events from the receipt.
      // For now, we will try to make an attestation optimistically if an ID becomes available via events.
      // A more robust solution would involve tx.wait() here and parsing logs.

      // Monitor for the ActivityLogged event to get the ID for attestation
      // This is a simplified approach. A robust solution might involve a direct tx.wait() and log parsing here.
      // Or, use a dedicated function to await the event from the contract call.
    } catch (e: any) {
      console.error("CONTRACT ERROR: logActivity:", e);
      notification.error(
        e.message?.includes("User rejected transaction")
          ? "Transaction rejected."
          : e.message || "Failed to log activity.",
      );
    }
  };

  const getActivityByIdFromState = (id: Hex): UserActivity | undefined => {
    return activities.find(activity => activity.id.toLowerCase() === id.toLowerCase());
  };

  const updateActivity = async (
    id: Hex,
    updates: Partial<Omit<UserActivity, "id" | "createdAt" | "updatedAt" | "owner" | "complianceDocuments">>,
  ) => {
    const currentActivity = getActivityByIdFromState(id);
    if (!currentActivity || !connectedAddress || !connectedChainId) {
      notification.error("Activity not found or wallet not connected.");
      return;
    }
    try {
      const activityStatusForContract = activityStatusToUint(
        updates.status || currentActivity?.status || UserActivityStatus.PLANNED,
      );

      await writeSAMAsync({
        functionName: "updateActivityDetails",
        args: [
          id,
          updates.name || currentActivity?.name || "Unnamed Activity",
          updates.description || currentActivity?.description || "",
          updates.organization || currentActivity?.organization || "",
          updates.projectManager || currentActivity?.projectManager || "",
          dateToTimestamp(updates.startDate || currentActivity?.startDate),
          dateToTimestamp(updates.endDate || currentActivity?.endDate),
          dateToTimestamp(updates.launchDateTime || currentActivity?.launchDateTime),
          activityStatusForContract,
          updates.externalApiLaunchId || currentActivity?.externalApiLaunchId || "",
          updates.externalApiSource || currentActivity?.externalApiSource || "",
          updates.launchSite || currentActivity?.launchSite || "",
          updates.destination || currentActivity?.destination || "",
          updates.payloadDetails || currentActivity?.payloadDetails || "",
        ],
      });
      notification.info("Activity update transaction submitted.");
      // Attestation for activity update (if fields relevant to a schema changed)
      // Example: If status change is attestable
      // await createAttestation({ schemaUID: YOUR_ACTIVITY_UPDATED_SCHEMA_UID, schemaString: YOUR_SCHEMA_STRING, values: [...] });
    } catch (e: any) {
      console.error("CONTRACT ERROR: updateActivityDetails:", e);
      notification.error(
        e.message?.includes("User rejected transaction")
          ? "Transaction rejected."
          : e.message || "Failed to update activity.",
      );
    }
  };

  const addComplianceDocument = async (activityId: Hex, docData: Omit<ComplianceDocument, "id">): Promise<void> => {
    if (!connectedAddress || !connectedChainId) {
      notification.error("Please connect your wallet to add a document.");
      return;
    }
    try {
      await writeSAMAsync({
        functionName: "addComplianceDocumentToActivity",
        args: [
          activityId,
          docData.documentName,
          docData.documentType,
          docData.documentHashOrLink,
          complianceStatusToUint(docData.status),
          dateToTimestamp(docData.submittedDate),
          dateToTimestamp(docData.expiryDate),
          docData.notes || "",
          docData.responsibleEntity || "",
        ],
      });
      notification.info("Add document transaction submitted.");

      // Attestation for adding a document
      // We need the documentId from the event. Similar to addActivity, this is simplified.
      // const docIdFromEvent = ... (obtain from event or transaction receipt)
      // if (docIdFromEvent) {
      //   await createAttestation({
      //     schemaUID: COMPLIANCE_DOC_ADDED_SCHEMA_UID,
      //     schemaString: COMPLIANCE_DOC_ADDED_SCHEMA_STRING,
      //     values: [activityId, docIdFromEvent, docData.documentName, docData.documentType, docData.documentHashOrLink, Math.floor(Date.now() / 1000)],
      //   });
      // }
    } catch (e: any) {
      console.error("CONTRACT ERROR: addComplianceDocumentToActivity:", e);
      notification.error(
        e.message?.includes("User rejected transaction")
          ? "Transaction rejected."
          : e.message || "Failed to add document.",
      );
    }
  };

  const updateComplianceDocumentStatus = async (
    activityId: Hex,
    docId: Hex,
    newStatus: ComplianceStatus,
    reviewDate?: string,
  ) => {
    if (!connectedAddress || !connectedChainId) {
      notification.error("Please connect your wallet to update document status.");
      return;
    }
    try {
      await writeSAMAsync({
        functionName: "updateComplianceDocumentStatusInActivity",
        args: [activityId, docId, complianceStatusToUint(newStatus), dateToTimestamp(reviewDate)],
      });
      notification.info("Update document status transaction submitted.");

      // Attestation for document status update
      // await createAttestation({
      //   schemaUID: COMPLIANCE_DOC_STATUS_UPDATED_SCHEMA_UID,
      //   schemaString: COMPLIANCE_DOC_STATUS_UPDATED_SCHEMA_STRING,
      //   values: [activityId, docId, complianceStatusToUint(newStatus), Math.floor(Date.now() / 1000)],
      // });
    } catch (e: any) {
      console.error("CONTRACT ERROR: updateComplianceDocumentStatusInActivity:", e);
      notification.error(
        e.message?.includes("User rejected transaction")
          ? "Transaction rejected."
          : e.message || "Failed to update document status.",
      );
    }
  };

  return (
    <UserActivityContext.Provider
      value={{
        activities,
        isLoadingActivities,
        addActivity,
        updateActivity,
        getActivityByIdFromState,
        addComplianceDocument,
        updateComplianceDocumentStatus,
        refetchActivities,
      }}
    >
      {children}
    </UserActivityContext.Provider>
  );
};

export const useUserActivity = (): UserActivityContextType => {
  const context = useContext(UserActivityContext);
  if (context === undefined) {
    throw new Error("useUserActivity must be used within a UserActivityProvider");
  }
  return context;
};
