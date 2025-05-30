"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { NextPage } from "next";
import toast from "react-hot-toast";
import { Hex, isHex } from "viem";
import { useAccount } from "wagmi";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentPlusIcon,
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useUserActivity } from "~~/contexts/UserActivityContext";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import {
  ACTIVITY_LOGGED_SCHEMA_UID,
  type AttestationResult,
  COMPLIANCE_DOC_ADDED_SCHEMA_UID,
  EAS_GRAPHQL_ENDPOINT_BASE,
  fetchAttestationsBySchemaAndAttester,
} from "~~/services/easService";
import {
  ComplianceDocument,
  ComplianceStatus,
  UserActivity,
  UserActivityStatus,
  UserActivityType,
} from "~~/types/lunargistics";

// --- Helper mappers for enums (Solidity uint to TS string) ---
const mapActivityTypeFromUint = (typeInt: number): UserActivityType => {
  const mapping: { [key: number]: UserActivityType } = {
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
  const mapping: { [key: number]: UserActivityStatus } = {
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
  const mapping: { [key: number]: ComplianceStatus } = {
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

// Helper to get the correct EASScan URL based on chain ID (assuming Base mainnet for now)
const getEASScanUrl = (attestationUID: Hex) => {
  return `${EAS_GRAPHQL_ENDPOINT_BASE.replace("/graphql", "")}/attestation/view/${attestationUID}`;
};

const ActivityDetailPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const activityIdParam = params.id as string;
  const activityIdFromRoute: Hex | undefined =
    isHex(activityIdParam) && activityIdParam.length === 66 ? activityIdParam : undefined;

  const { updateActivity, addComplianceDocument, updateComplianceDocumentStatus, refetchActivities } =
    useUserActivity();
  const { address: connectedAddress, chainId } = useAccount();

  const [activity, setActivity] = useState<UserActivity | null>(null);

  // EAS Attestation States
  const [activityAttestation, setActivityAttestation] = useState<AttestationResult | null | undefined>(undefined);
  const [docAttestations, setDocAttestations] = useState<Record<Hex, AttestationResult | null | undefined>>({});
  const [isLoadingAttestations, setIsLoadingAttestations] = useState(false);

  const readContractArgs: readonly [Hex] | undefined = activityIdFromRoute ? [activityIdFromRoute] : undefined;

  const {
    data: rawActivityFromContract,
    isLoading: isLoadingActivity,
    refetch: refetchThisActivity,
  } = useScaffoldReadContract({
    contractName: "SpaceActivityManager",
    functionName: "getActivityById",
    args: readContractArgs,
  });

  useEffect(() => {
    if (!activityIdFromRoute && params.id) {
      toast.error("Invalid Activity ID format in URL.");
      router.push("/activities");
      return;
    }

    if (rawActivityFromContract && activityIdFromRoute) {
      const contractActivity = rawActivityFromContract as any;
      if (
        !contractActivity ||
        !contractActivity.id ||
        contractActivity.id === "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        if (!isLoadingActivity) {
          if (params.id && activityIdFromRoute) toast.error("Activity data appears invalid or empty for ID.");
          setActivity(null);
        }
        return;
      }

      const mappedDocs: ComplianceDocument[] = (contractActivity.complianceDocuments || []).map((doc: any) => ({
        id: doc.id as Hex,
        documentName: doc.documentName,
        documentType: doc.documentType,
        documentHashOrLink: doc.documentHashOrLink,
        status: mapComplianceStatusFromUint(Number(doc.status)),
        submittedDate:
          BigInt(doc.submittedDate || 0) > 0n ? new Date(Number(doc.submittedDate) * 1000).toISOString() : undefined,
        reviewDate:
          BigInt(doc.reviewDate || 0) > 0n ? new Date(Number(doc.reviewDate) * 1000).toISOString() : undefined,
        expiryDate:
          BigInt(doc.expiryDate || 0) > 0n ? new Date(Number(doc.expiryDate) * 1000).toISOString() : undefined,
        notes: doc.notes,
        responsibleEntity: doc.responsibleEntity,
      }));

      const mappedActivity: UserActivity = {
        id: contractActivity.id as Hex,
        owner: contractActivity.owner as Hex,
        type: mapActivityTypeFromUint(Number(contractActivity.activityType)),
        name: contractActivity.name,
        description: contractActivity.description,
        organization: contractActivity.organization,
        projectManager: contractActivity.projectManager,
        startDate:
          BigInt(contractActivity.startDate || 0) > 0n
            ? new Date(Number(contractActivity.startDate) * 1000).toISOString()
            : undefined,
        endDate:
          BigInt(contractActivity.endDate || 0) > 0n
            ? new Date(Number(contractActivity.endDate) * 1000).toISOString()
            : undefined,
        launchDateTime:
          BigInt(contractActivity.launchDateTime || 0) > 0n
            ? new Date(Number(contractActivity.launchDateTime) * 1000).toISOString()
            : undefined,
        status: mapActivityStatusFromUint(Number(contractActivity.status)),
        externalApiLaunchId: contractActivity.externalApiLaunchId,
        externalApiSource: contractActivity.externalApiSource,
        launchSite: contractActivity.launchSite,
        destination: contractActivity.destination,
        payloadDetails: contractActivity.payloadDetails,
        complianceDocuments: mappedDocs,
        createdAt: new Date(Number(contractActivity.createdAt) * 1000).toISOString(),
        updatedAt: new Date(Number(contractActivity.updatedAt) * 1000).toISOString(),
      };
      setActivity(mappedActivity);
      setEditableActivityDetails({
        name: mappedActivity.name,
        description: mappedActivity.description,
        status: mappedActivity.status,
        type: mappedActivity.type,
        organization: mappedActivity.organization,
        startDate: mappedActivity.startDate?.split("T")[0],
        endDate: mappedActivity.endDate?.split("T")[0],
        launchDateTime: mappedActivity.launchDateTime?.substring(0, 16),
        launchSite: mappedActivity.launchSite,
        destination: mappedActivity.destination,
        payloadDetails: mappedActivity.payloadDetails,
      });
    } else if (!isLoadingActivity && activityIdFromRoute && !rawActivityFromContract) {
      toast.error("Activity details could not be loaded or activity does not exist.");
      setActivity(null);
    }
  }, [rawActivityFromContract, isLoadingActivity, activityIdFromRoute, router, params.id]);

  useEffect(() => {
    if (activity && activity.id && activity.owner && connectedAddress) {
      const fetchAllAttestations = async () => {
        setIsLoadingAttestations(true);
        setActivityAttestation(undefined);
        setDocAttestations({});

        try {
          const activityAtts = await fetchAttestationsBySchemaAndAttester(
            ACTIVITY_LOGGED_SCHEMA_UID as Hex,
            activity.owner as Hex,
            chainId,
          );
          const foundActivityAtt = activityAtts.find(att => {
            try {
              const decoded = JSON.parse(att.decodedDataJson);
              const activityIdField = decoded.find(
                (field: { name: string; value: any }) => field.name === "activityId",
              );
              return activityIdField?.value === activity.id;
            } catch (e) {
              return false;
            }
          });
          setActivityAttestation(foundActivityAtt || null);

          if (activity.complianceDocuments && activity.complianceDocuments.length > 0) {
            const docAttsPromises = activity.complianceDocuments.map(async doc => {
              const compDocAtts = await fetchAttestationsBySchemaAndAttester(
                COMPLIANCE_DOC_ADDED_SCHEMA_UID as Hex,
                activity.owner as Hex,
                chainId,
              );
              const foundDocAtt = compDocAtts.find(att => {
                try {
                  const decoded = JSON.parse(att.decodedDataJson);
                  const activityIdField = decoded.find(
                    (field: { name: string; value: any }) => field.name === "activityId",
                  );
                  const documentIdField = decoded.find(
                    (field: { name: string; value: any }) => field.name === "documentId",
                  );
                  return activityIdField?.value === activity.id && documentIdField?.value === doc.id;
                } catch (e) {
                  return false;
                }
              });
              return { docId: doc.id, attestation: foundDocAtt || null };
            });
            const resolvedDocAtts = await Promise.all(docAttsPromises);
            const newDocAttsState: Record<Hex, AttestationResult | null | undefined> = {};
            resolvedDocAtts.forEach(res => {
              newDocAttsState[res.docId as Hex] = res.attestation;
            });
            setDocAttestations(newDocAttsState);
          }
        } catch (error) {
          console.error("Failed to fetch attestations:", error);
          toast.error("Could not load attestation data.");
          setActivityAttestation(null);
        }
        setIsLoadingAttestations(false);
      };
      fetchAllAttestations();
    }
  }, [activity, connectedAddress, chainId, refetchActivities]);

  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ComplianceDocument | null>(null);
  const [docFormData, setDocFormData] = useState<Omit<ComplianceDocument, "id">>({
    documentName: "",
    documentType: "",
    documentHashOrLink: "",
    status: ComplianceStatus.PENDING_SUBMISSION,
    notes: "",
    submittedDate: "",
    responsibleEntity: "",
    expiryDate: "",
    reviewDate: "",
  });

  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [editableActivityDetails, setEditableActivityDetails] = useState<Partial<UserActivity>>({});

  const handleDocFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDocFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddDocModal = () => {
    setEditingDoc(null);
    setDocFormData({
      documentName: "",
      documentType: "",
      documentHashOrLink: "",
      status: ComplianceStatus.PENDING_SUBMISSION,
      notes: "",
      submittedDate: "",
      responsibleEntity: "",
      expiryDate: "",
      reviewDate: "",
    });
    setShowDocModal(true);
  };

  const openEditDocModal = (doc: ComplianceDocument) => {
    setEditingDoc(doc);
    setDocFormData({
      documentName: doc.documentName,
      documentType: doc.documentType,
      documentHashOrLink: doc.documentHashOrLink,
      status: doc.status,
      notes: doc.notes || "",
      submittedDate: doc.submittedDate?.split("T")[0] || "",
      responsibleEntity: doc.responsibleEntity || "",
      expiryDate: doc.expiryDate?.split("T")[0] || "",
      reviewDate: doc.reviewDate?.split("T")[0] || "",
    });
    setShowDocModal(true);
  };

  const handleDocSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activity || !docFormData.documentName || !docFormData.documentType) {
      toast.error("Document name and type are required.");
      return;
    }
    const processedDocFormData = {
      ...docFormData,
      submittedDate: docFormData.submittedDate || undefined,
      expiryDate: docFormData.expiryDate || undefined,
      reviewDate: docFormData.reviewDate || undefined,
    };

    const currentActivityId = activity.id as Hex;
    if (editingDoc) {
      await updateComplianceDocumentStatus(
        currentActivityId,
        editingDoc.id as Hex,
        processedDocFormData.status,
        processedDocFormData.reviewDate,
      );
      toast("Document status update attempted.", { icon: "ℹ️" });
    } else {
      await addComplianceDocument(currentActivityId, processedDocFormData);
    }
    setShowDocModal(false);
    refetchThisActivity();
    if (refetchActivities) refetchActivities();
  };

  const handleDeleteDoc = async (docId: Hex) => {
    if (activity && confirm("Are you sure? This action is for UI only as on-chain deletion is not implemented.")) {
      toast("Simulating document removal from UI. On-chain array item removal is complex.", { icon: "ℹ️" });
      setActivity(prev =>
        prev
          ? {
              ...prev,
              complianceDocuments: prev.complianceDocuments.filter(d => d.id !== docId),
            }
          : null,
      );
      setDocAttestations(prev => {
        const newState = { ...prev };
        delete newState[docId];
        return newState;
      });
    }
  };

  const handleActivityDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditableActivityDetails(prev => ({ ...prev, [name]: value as any }));
  };

  const handleSaveActivityDetails = async () => {
    if (activity && editableActivityDetails && activityIdFromRoute) {
      const updatesToApply = { ...editableActivityDetails } as Partial<UserActivity>;
      if (updatesToApply.startDate === "") updatesToApply.startDate = undefined;
      if (updatesToApply.endDate === "") updatesToApply.endDate = undefined;
      if (updatesToApply.launchDateTime === "") updatesToApply.launchDateTime = undefined;

      const fullArgsForContract = {
        name: updatesToApply.name || activity.name,
        description: updatesToApply.description || activity.description,
        organization: updatesToApply.organization || activity.organization || "",
        projectManager: updatesToApply.projectManager || activity.projectManager || "",
        startDate: updatesToApply.startDate,
        endDate: updatesToApply.endDate,
        launchDateTime: updatesToApply.launchDateTime,
        status: updatesToApply.status || activity.status,
        externalApiLaunchId: updatesToApply.externalApiLaunchId || activity.externalApiLaunchId || "",
        externalApiSource: updatesToApply.externalApiSource || activity.externalApiSource || "",
        launchSite: updatesToApply.launchSite || activity.launchSite || "",
        destination: updatesToApply.destination || activity.destination || "",
        payloadDetails: updatesToApply.payloadDetails || activity.payloadDetails || "",
      };

      await updateActivity(activityIdFromRoute, fullArgsForContract as any);
      setIsEditingActivity(false);
      refetchThisActivity();
      if (refetchActivities) refetchActivities();
    }
  };

  const getComplianceStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.APPROVED:
        return "badge-success";
      case ComplianceStatus.REJECTED:
        return "badge-error";
      case ComplianceStatus.PENDING_REVIEW:
        return "badge-info";
      case ComplianceStatus.ACTION_REQUIRED:
        return "badge-warning";
      case ComplianceStatus.EXPIRED:
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  const renderAttestationStatus = (attestation: AttestationResult | null | undefined) => {
    if (attestation === undefined || isLoadingAttestations) {
      return (
        <span className="text-xs opacity-60">
          (<ClockIcon className="h-3 w-3 inline-block mr-1" />
          Checking attestation...)
        </span>
      );
    }
    if (attestation === null) {
      return (
        <span className="text-xs text-error">
          (<ExclamationCircleIcon className="h-3 w-3 inline-block mr-1" />
          Not attested)
        </span>
      );
    }
    return (
      <Link
        href={getEASScanUrl(attestation.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-success hover:underline tooltip"
        data-tip={`Attested on ${new Date(attestation.time * 1000).toLocaleDateString()}. UID: ${attestation.id.substring(0, 10)}...`}
      >
        (<CheckCircleIcon className="h-3 w-3 inline-block mr-1" />
        Attested)
      </Link>
    );
  };

  if (isLoadingActivity || (!activityIdFromRoute && params.id)) {
    return (
      <div className="container mx-auto p-6 text-center">
        Loading activity data... If this persists, the ID in the URL might be invalid.
      </div>
    );
  }
  if (!activity && !isLoadingActivity && activityIdFromRoute) {
    return (
      <div className="container mx-auto p-6 text-center">
        Activity <code className="text-sm bg-base-300 p-1 rounded">{activityIdFromRoute}</code> not found.{" "}
        <Link href="/activities" className="link link-primary">
          Return to My Activities
        </Link>
      </div>
    );
  }
  if (!activity) {
    return <div className="container mx-auto p-6 text-center">Preparing activity details or ID invalid...</div>;
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <button
          onClick={() => router.push("/activities")}
          className="btn btn-ghost btn-sm mb-6 text-primary hover:bg-primary/10"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to My Activities
        </button>

        <div className="bg-base-200 p-6 sm:p-8 rounded-lg shadow-xl mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-1 flex items-center">
                {activity.name}
                <span className="ml-2">{renderAttestationStatus(activityAttestation)}</span>
              </h1>
              <p className="text-sm text-base-content/70">
                Type: {activity.type} | Status:{" "}
                <span
                  className={`badge badge-sm ${activity.status.includes("Success") ? "badge-success" : "badge-ghost"}`}
                >
                  {activity.status}
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                setIsEditingActivity(!isEditingActivity);
                if (!isEditingActivity && activity) {
                  setEditableActivityDetails({
                    name: activity.name,
                    description: activity.description,
                    status: activity.status,
                    type: activity.type,
                    organization: activity.organization,
                    startDate: activity.startDate?.split("T")[0],
                    endDate: activity.endDate?.split("T")[0],
                    launchDateTime: activity.launchDateTime?.substring(0, 16),
                    launchSite: activity.launchSite,
                    destination: activity.destination,
                    payloadDetails: activity.payloadDetails,
                  });
                }
              }}
              className="btn btn-sm btn-outline btn-secondary"
            >
              {isEditingActivity ? (
                "Cancel Edit"
              ) : (
                <>
                  <PencilIcon className="h-4 w-4 mr-1" /> Edit Details
                </>
              )}
            </button>
          </div>

          {isEditingActivity ? (
            <div className="space-y-4 mb-4 p-4 border border-base-300 rounded-md">
              <h3 className="text-lg font-semibold text-secondary mb-2">Edit Activity Details</h3>
              <div>
                <label htmlFor="edit-name" className="label text-sm">
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  name="name"
                  value={editableActivityDetails.name || ""}
                  onChange={handleActivityDetailsChange}
                  className="input input-bordered w-full bg-base-100"
                />
              </div>
              <div>
                <label htmlFor="edit-type" className="label text-sm">
                  Type
                </label>
                <select
                  id="edit-type"
                  name="type"
                  value={editableActivityDetails.type || UserActivityType.OTHER}
                  onChange={handleActivityDetailsChange}
                  className="select select-bordered w-full bg-base-100"
                >
                  {Object.values(UserActivityType).map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-description" className="label text-sm">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editableActivityDetails.description || ""}
                  onChange={handleActivityDetailsChange}
                  className="textarea textarea-bordered w-full bg-base-100"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label htmlFor="edit-organization" className="label text-sm">
                  Organization
                </label>
                <input
                  id="edit-organization"
                  type="text"
                  name="organization"
                  value={editableActivityDetails.organization || ""}
                  onChange={handleActivityDetailsChange}
                  className="input input-bordered w-full bg-base-100"
                />
              </div>
              <div>
                <label htmlFor="edit-status" className="label text-sm">
                  Status
                </label>
                <select
                  id="edit-status"
                  name="status"
                  value={editableActivityDetails.status || UserActivityStatus.PLANNED}
                  onChange={handleActivityDetailsChange}
                  className="select select-bordered w-full bg-base-100"
                >
                  {Object.values(UserActivityStatus).map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-startDate" className="label text-sm">
                    Start Date
                  </label>
                  <input
                    id="edit-startDate"
                    type="date"
                    name="startDate"
                    value={editableActivityDetails.startDate || ""}
                    onChange={handleActivityDetailsChange}
                    className="input input-bordered w-full bg-base-100"
                  />
                </div>
                <div>
                  <label htmlFor="edit-endDate" className="label text-sm">
                    End Date
                  </label>
                  <input
                    id="edit-endDate"
                    type="date"
                    name="endDate"
                    value={editableActivityDetails.endDate || ""}
                    onChange={handleActivityDetailsChange}
                    className="input input-bordered w-full bg-base-100"
                  />
                </div>
              </div>
              {(editableActivityDetails.type === UserActivityType.ROCKET_LAUNCH ||
                editableActivityDetails.type === UserActivityType.SATELLITE_DEPLOYMENT) && (
                <>
                  <div>
                    <label htmlFor="edit-launchDateTime" className="label text-sm">
                      Launch Date & Time
                    </label>
                    <input
                      id="edit-launchDateTime"
                      type="datetime-local"
                      name="launchDateTime"
                      value={editableActivityDetails.launchDateTime || ""}
                      onChange={handleActivityDetailsChange}
                      className="input input-bordered w-full bg-base-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-launchSite" className="label text-sm">
                      Launch Site
                    </label>
                    <input
                      id="edit-launchSite"
                      type="text"
                      name="launchSite"
                      value={editableActivityDetails.launchSite || ""}
                      onChange={handleActivityDetailsChange}
                      className="input input-bordered w-full bg-base-100"
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="edit-destination" className="label text-sm">
                  Destination
                </label>
                <input
                  id="edit-destination"
                  type="text"
                  name="destination"
                  value={editableActivityDetails.destination || ""}
                  onChange={handleActivityDetailsChange}
                  className="input input-bordered w-full bg-base-100"
                />
              </div>
              <div>
                <label htmlFor="edit-payloadDetails" className="label text-sm">
                  Payload Details
                </label>
                <textarea
                  id="edit-payloadDetails"
                  name="payloadDetails"
                  value={editableActivityDetails.payloadDetails || ""}
                  onChange={handleActivityDetailsChange}
                  className="textarea textarea-bordered w-full bg-base-100"
                  rows={2}
                ></textarea>
              </div>
              <button onClick={handleSaveActivityDetails} className="btn btn-primary btn-sm">
                Save Changes
              </button>
              <button onClick={() => setIsEditingActivity(false)} className="btn btn-ghost btn-sm ml-2">
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-base-content/80 mb-4 whitespace-pre-wrap">{activity.description}</p>
          )}

          {!isEditingActivity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-base-content/90 mt-4">
              <p>
                <strong>Organization:</strong> {activity.organization || "N/A"}
              </p>
              <p>
                <strong>Start Date:</strong>{" "}
                {activity.startDate ? new Date(activity.startDate).toLocaleDateString() : "N/A"}
              </p>
              <p>
                <strong>End Date:</strong> {activity.endDate ? new Date(activity.endDate).toLocaleDateString() : "N/A"}
              </p>
              {(activity.type === UserActivityType.ROCKET_LAUNCH ||
                activity.type === UserActivityType.SATELLITE_DEPLOYMENT) && (
                <>
                  <p>
                    <strong>Launch Date/Time:</strong>{" "}
                    {activity.launchDateTime ? new Date(activity.launchDateTime).toLocaleString() : "N/A"}
                  </p>
                  <p>
                    <strong>Launch Site:</strong> {activity.launchSite || "N/A"}
                  </p>
                </>
              )}
              <p>
                <strong>Destination:</strong> {activity.destination || "N/A"}
              </p>
              <p>
                <strong>Payload:</strong> {activity.payloadDetails || "N/A"}
              </p>
              <p>
                <strong>Owner:</strong>{" "}
                <Link
                  href={`https://basescan.org/address/${activity.owner}`}
                  target="_blank"
                  className="link link-accent text-xs"
                >
                  {activity.owner}
                </Link>
              </p>
              <p>
                <strong>Activity ID:</strong> <code className="text-xs bg-base-300 p-1 rounded">{activity.id}</code>
              </p>
              <p>
                <strong>Created:</strong> {new Date(activity.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Last Updated:</strong> {new Date(activity.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-base-200 p-6 sm:p-8 rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-secondary">Compliance Documents</h2>
            <button onClick={openAddDocModal} className="btn btn-secondary btn-sm hover:bg-secondary-focus">
              <DocumentPlusIcon className="h-5 w-5 mr-2" />
              Add Document
            </button>
          </div>

          {activity.complianceDocuments.length === 0 ? (
            <p className="text-base-content/70 text-center py-4">No compliance documents added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead className="bg-base-300/70">
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Attestation</th>
                    <th>Submitted</th>
                    <th>Link/Hash</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.complianceDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-base-300/40 transition-colors">
                      <td>{doc.documentName}</td>
                      <td>{doc.documentType}</td>
                      <td>
                        <span className={`badge badge-xs ${getComplianceStatusColor(doc.status)}`}>{doc.status}</span>
                      </td>
                      <td>{renderAttestationStatus(docAttestations[doc.id as Hex])}</td>
                      <td>{doc.submittedDate ? new Date(doc.submittedDate).toLocaleDateString() : "-"}</td>
                      <td className="truncate max-w-[100px] sm:max-w-xs" title={doc.documentHashOrLink}>
                        {doc.documentHashOrLink || "N/A"}
                      </td>
                      <td className="space-x-1">
                        <button
                          onClick={() => openEditDocModal(doc)}
                          className="btn btn-xs btn-outline btn-info p-1 tooltip"
                          data-tip="Edit Doc"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id as Hex)}
                          className="btn btn-xs btn-outline btn-error p-1 tooltip"
                          data-tip="Delete Doc"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDocModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box bg-base-100 relative">
            <button
              onClick={() => setShowDocModal(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-primary mb-4">
              {editingDoc ? "Edit Compliance Document" : "Add New Compliance Document"}
            </h3>
            <form onSubmit={handleDocSubmit} className="space-y-4">
              <div>
                <label htmlFor="docName" className="label text-sm">
                  Document Name*
                </label>
                <input
                  type="text"
                  id="docName"
                  name="documentName"
                  value={docFormData.documentName}
                  onChange={handleDocFormChange}
                  required
                  className="input input-bordered w-full bg-base-200"
                />
              </div>
              <div>
                <label htmlFor="docType" className="label text-sm">
                  Document Type*
                </label>
                <input
                  type="text"
                  id="docType"
                  name="documentType"
                  value={docFormData.documentType}
                  onChange={handleDocFormChange}
                  required
                  className="input input-bordered w-full bg-base-200"
                />
              </div>
              <div>
                <label htmlFor="docLink" className="label text-sm">
                  Document Hash/Link
                </label>
                <input
                  type="text"
                  id="docLink"
                  name="documentHashOrLink"
                  value={docFormData.documentHashOrLink}
                  onChange={handleDocFormChange}
                  className="input input-bordered w-full bg-base-200"
                />
              </div>
              <div>
                <label htmlFor="docStatus" className="label text-sm">
                  Status
                </label>
                <select
                  id="docStatus"
                  name="status"
                  value={docFormData.status}
                  onChange={handleDocFormChange}
                  className="select select-bordered w-full bg-base-200"
                >
                  {Object.values(ComplianceStatus).map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="docSubmittedDate" className="label text-sm">
                  Submitted Date
                </label>
                <input
                  type="date"
                  id="docSubmittedDate"
                  name="submittedDate"
                  value={docFormData.submittedDate?.split("T")[0] || ""}
                  onChange={handleDocFormChange}
                  className="input input-bordered w-full bg-base-200"
                />
              </div>
              <div>
                <label htmlFor="docResponsibleEntity" className="label text-sm">
                  Responsible Entity
                </label>
                <input
                  type="text"
                  id="docResponsibleEntity"
                  name="responsibleEntity"
                  value={docFormData.responsibleEntity || ""}
                  onChange={handleDocFormChange}
                  className="input input-bordered w-full bg-base-200"
                />
              </div>
              <div>
                <label htmlFor="docExpiryDate" className="label text-sm">
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="docExpiryDate"
                  name="expiryDate"
                  value={docFormData.expiryDate?.split("T")[0] || ""}
                  onChange={handleDocFormChange}
                  className="input input-bordered w-full bg-base-200"
                />
              </div>
              <div>
                <label htmlFor="docReviewDate" className="label text-sm">
                  Review Date
                </label>
                <input
                  type="text"
                  id="docReviewDate"
                  name="reviewDate"
                  value={docFormData.reviewDate?.split("T")[0] || ""}
                  onChange={handleDocFormChange}
                  className="input input-bordered w-full bg-base-200"
                />
              </div>
              <div>
                <label htmlFor="docNotes" className="label text-sm">
                  Notes
                </label>
                <textarea
                  id="docNotes"
                  name="notes"
                  value={docFormData.notes || ""}
                  onChange={handleDocFormChange}
                  rows={2}
                  className="textarea textarea-bordered w-full bg-base-200"
                ></textarea>
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {editingDoc ? "Save Changes" : "Add Document"}
                </button>
                <button type="button" onClick={() => setShowDocModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDetailPage;
