"use client";

import { useState } from "react";
import Link from "next/link";
import { Hex } from "viem";
import { AdjustmentsHorizontalIcon, ArrowPathIcon, EyeIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { useUserActivity } from "~~/contexts/UserActivityContext";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { UserActivityStatus, UserActivityType } from "~~/types/lunargistics";

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
        <td colSpan={6} className="text-center py-2 text-red-400">
          Failed to load activity details
        </td>
      </tr>
    );
  }

  // activityDetails is an object with named properties, not a tuple
  const { name: title, description, activityType, status, startDate } = activityDetails;

  const mappedType = mapActivityTypeFromUint(Number(activityType));
  const mappedStatus = mapActivityStatusFromUint(Number(status));

  const formatDate = (timestamp: bigint) => {
    if (timestamp === 0n) return "Not set";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getStatusColor = (status: UserActivityStatus) => {
    switch (status) {
      case UserActivityStatus.COMPLETED_SUCCESS:
        return "text-green-400";
      case UserActivityStatus.COMPLETED_FAILURE:
        return "text-red-400";
      case UserActivityStatus.IN_PROGRESS:
        return "text-blue-400";
      case UserActivityStatus.ON_HOLD:
        return "text-yellow-400";
      case UserActivityStatus.CANCELLED:
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <tr className="hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3 text-white font-medium">{title}</td>
      <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{description}</td>
      <td className="px-4 py-3 text-purple-400">{mappedType.replace(/_/g, " ")}</td>
      <td className={`px-4 py-3 ${getStatusColor(mappedStatus)}`}>{mappedStatus.replace(/_/g, " ")}</td>
      <td className="px-4 py-3 text-gray-300">{formatDate(startDate)}</td>
      <td className="px-4 py-3 text-center">
        <Link
          href={`/activities/${activityId}`}
          className="inline-flex items-center px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </Link>
      </td>
    </tr>
  );
};

export const ActivitiesDashboard = () => {
  const [showFilters, setShowFilters] = useState(false);
  const { refetchActivities: globalRefetch } = useUserActivity();

  const {
    data: allActivityIds,
    isLoading: isLoadingIds,
    refetch: refetchIdsFromContract,
  } = useScaffoldReadContract({
    contractName: "SpaceActivityManager",
    functionName: "getAllActivityIds",
  });

  const handleRefresh = () => {
    if (refetchIdsFromContract) refetchIdsFromContract();
    if (globalRefetch) globalRefetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex gap-2 items-center">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white text-sm transition-colors flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" /> Refresh List
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white text-sm transition-colors flex items-center"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" /> Filters {showFilters ? "(Hide)" : "(Show)"}
          </button>
          <Link
            href="/activities/new"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors flex items-center"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Log New Activity
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="mb-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center text-gray-400 col-span-full">
            Filters coming soon - advanced filtering will be available in future updates
          </div>
        </div>
      )}

      {isLoadingIds && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading activities...</p>
        </div>
      )}

      {!isLoadingIds && (!allActivityIds || (allActivityIds as Hex[]).length === 0) && (
        <div className="text-center bg-gray-800 border border-gray-700 p-8 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
          <h3 className="text-xl font-medium text-white mb-2">No activities logged yet</h3>
          <p className="text-gray-400 mb-6">Get started by logging your first space activity on-chain.</p>
          <Link
            href="/activities/new"
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Log First Activity
          </Link>
        </div>
      )}

      {!isLoadingIds && allActivityIds && (allActivityIds as Hex[]).length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Start Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {(allActivityIds as Hex[]).map(activityId => (
                  <ActivityRow key={activityId} activityId={activityId} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
