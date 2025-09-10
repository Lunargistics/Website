"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import toast from "react-hot-toast";
import { Hex } from "viem";
import { AdjustmentsHorizontalIcon, ArrowPathIcon, EyeIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { useUserActivity } from "~~/contexts/UserActivityContext";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { UserActivity, UserActivityStatus, UserActivityType } from "~~/types/lunargistics";

// --- Helper to map contract enum numbers back to TS strings (for display) ---
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

// Component for displaying a single activity row, fetching its details
const ActivityRow = ({ activityId }: { activityId: Hex }) => {
  const { data: activityDetails, isLoading: isLoadingDetails } = useScaffoldReadContract({
    contractName: "SpaceActivityManager",
    functionName: "getActivityById",
    args: [activityId],
  });

  // TODO: Implement on-chain delete or status update for deletion
  // const { deleteActivity } = useUserActivity();
  // const handleDelete = () => { ... }

  if (isLoadingDetails) {
    return (
      <tr>
        <td colSpan={6} className="text-center py-2">
          <span className="loading loading-dots loading-sm"></span>
        </td>
      </tr>
    );
  }

  if (!activityDetails) {
    return (
      <tr>
        <td colSpan={6} className="text-center text-error py-2">
          Error loading details for {activityId}
        </td>
      </tr>
    );
  }

  // Assuming activityDetails matches the structure of our UserActivity type after mapping enums/dates
  const displayActivity: Partial<UserActivity> = {
    id: activityDetails.id as Hex,
    name: activityDetails.name,
    type: mapActivityTypeFromUint(Number(activityDetails.activityType)),
    status: mapActivityStatusFromUint(Number(activityDetails.status)),
    startDate:
      activityDetails.startDate > 0 ? new Date(Number(activityDetails.startDate) * 1000).toLocaleDateString() : "N/A",
    createdAt: new Date(Number(activityDetails.createdAt) * 1000).toLocaleDateString(),
  };

  return (
    <tr className="hover:bg-base-300/40 transition-colors">
      <td>{displayActivity.name}</td>
      <td>{displayActivity.type}</td>
      <td>
        <span
          className={`badge badge-sm ${displayActivity.status?.includes("Success") ? "badge-success" : displayActivity.status?.includes("Failure") || displayActivity.status?.includes("Cancelled") ? "badge-error" : displayActivity.status?.includes("Progress") || displayActivity.status?.includes("Preparation") ? "badge-info" : "badge-warning"}`}
        >
          {displayActivity.status}
        </span>
      </td>
      <td>{displayActivity.startDate}</td>
      <td>{displayActivity.createdAt}</td>
      <td className="space-x-1 whitespace-nowrap">
        <Link
          href={`/activities/${activityId}`}
          className="btn btn-xs btn-outline btn-accent p-1 tooltip"
          data-tip="View/Manage"
        >
          <EyeIcon className="h-4 w-4" />
        </Link>
        {/* Deletion to be re-implemented with on-chain logic */}
        {/* <button onClick={handleDelete} className="btn btn-xs btn-outline btn-error p-1 tooltip" data-tip="Delete">
          <TrashIcon className="h-4 w-4"/>
        </button> */}
      </td>
    </tr>
  );
};

const MyActivitiesPage: NextPage = () => {
  // Removed direct use of activities from context; will use IDs and fetch details per row
  const { refetchActivities: globalRefetch } = useUserActivity();

  const {
    data: allActivityIds,
    isLoading: isLoadingIds,
    refetch: refetchIdsFromContract,
  } = useScaffoldReadContract({
    contractName: "SpaceActivityManager",
    functionName: "getAllActivityIds",
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleRefresh = () => {
    toast.promise(refetchIdsFromContract(), {
      loading: "Refreshing activity list...",
      success: <b>Activity list refreshed!</b>,
      error: <b>Could not refresh list.</b>,
    });
    if (globalRefetch) globalRefetch(); // This might be redundant if refetchIdsFromContract is enough
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content py-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div className="flex gap-2 items-center">
            <button onClick={handleRefresh} className="btn btn-sm btn-outline btn-neutral">
              <ArrowPathIcon className="h-4 w-4 mr-1" /> Refresh List
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="btn btn-sm btn-outline btn-neutral">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" /> Filters {showFilters ? "(Hide)" : "(Show)"}
            </button>
            <Link href="/activities/new" className="btn btn-primary btn-sm hover:bg-primary-focus transition-colors">
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Log New Activity
            </Link>
          </div>
        </div>

        {/* Filters Section (UI can remain, logic to be connected if re-enabled) */}
        {showFilters && (
          <div className="mb-8 p-4 bg-base-300/30 rounded-lg shadow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Filter controls ... keep UI but filtering logic will be complex with per-row fetching */}
          </div>
        )}

        {isLoadingIds && <p className="text-center py-4">Loading activity IDs...</p>}
        {!isLoadingIds && (!allActivityIds || (allActivityIds as Hex[]).length === 0) && (
          <div className="text-center bg-base-200 p-8 rounded-lg shadow-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-xl font-medium text-base-content/90">No activities logged on-chain yet.</h3>
            <p className="mt-1 text-sm text-base-content/70">Get started by logging your first space activity.</p>
            <div className="mt-6">
              <Link href="/activities/new" className="btn btn-secondary hover:bg-secondary-focus transition-colors">
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Log First Activity
              </Link>
            </div>
          </div>
        )}

        {!isLoadingIds && allActivityIds && (allActivityIds as Hex[]).length > 0 && (
          <div className="bg-base-200 p-2 sm:p-4 rounded-lg shadow-xl overflow-x-auto">
            <table className="table table-sm sm:table-md w-full">
              <thead className="bg-base-300/70">
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(allActivityIds as Hex[]).map((activityId: Hex) => (
                  <ActivityRow key={activityId} activityId={activityId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyActivitiesPage;
