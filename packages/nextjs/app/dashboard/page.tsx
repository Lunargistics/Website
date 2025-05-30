"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useUserActivity } from "~~/contexts/UserActivityContext";
import {
  RocketLaunch,
  getUpcomingSatelliteDeployments as getGeneralSatelliteLaunches,
  getNextLaunches,
} from "~~/services/launchApiService";
import { SpaceXLaunch, getPastSpaceXLaunches, getPastSpaceXSatelliteLaunches } from "~~/services/spacexApiService";
import { ComplianceStatus, UserActivity } from "~~/types/lunargistics";

const DashboardPage: NextPage = () => {
  // State for RocketLaunch.live data
  const [upcomingLaunches, setUpcomingLaunches] = useState<RocketLaunch[]>([]);
  const [isLoadingUpcomingLaunches, setIsLoadingUpcomingLaunches] = useState(true);
  const [upcomingLaunchError, setUpcomingLaunchError] = useState<string | null>(null);

  // State for SpaceX data (general past launches)
  const [pastSpaceXLaunches, setPastSpaceXLaunches] = useState<SpaceXLaunch[]>([]);
  const [isLoadingSpaceXLaunches, setIsLoadingSpaceXLaunches] = useState(true);
  const [spaceXLaunchError, setSpaceXLaunchError] = useState<string | null>(null);

  // State for Satellite Deployment Data
  const [upcomingGeneralSatellites, setUpcomingGeneralSatellites] = useState<RocketLaunch[]>([]);
  const [pastSpaceXSatellites, setPastSpaceXSatellites] = useState<SpaceXLaunch[]>([]);
  const [isLoadingSatellites, setIsLoadingSatellites] = useState(true);
  const [satelliteError, setSatelliteError] = useState<string | null>(null);

  // Get activities from context
  const { activities: userActivities, isLoadingActivities } = useUserActivity();

  // Derived state for Compliance Dashboard
  const complianceSummary = useMemo(() => {
    if (!userActivities || userActivities.length === 0) {
      return {
        totalDocuments: 0,
        pendingReview: 0,
        approved: 0,
        actionRequired: 0,
        attentionItems: [], // For documents needing urgent attention
      };
    }
    let totalDocuments = 0;
    let pendingReview = 0;
    let approved = 0;
    let actionRequired = 0;
    const attentionItems: { activityName: string; docName: string; status: ComplianceStatus; activityId: string }[] =
      [];

    userActivities.forEach((activity: UserActivity) => {
      activity.complianceDocuments.forEach(doc => {
        totalDocuments++;
        if (doc.status === ComplianceStatus.PENDING_REVIEW) pendingReview++;
        if (doc.status === ComplianceStatus.APPROVED) approved++;
        if (
          doc.status === ComplianceStatus.REJECTED ||
          doc.status === ComplianceStatus.ACTION_REQUIRED ||
          doc.status === ComplianceStatus.EXPIRED
        ) {
          actionRequired++;
          if (attentionItems.length < 3) {
            // Limit attention items shown on dashboard
            attentionItems.push({
              activityName: activity.name,
              docName: doc.documentName,
              status: doc.status,
              activityId: activity.id,
            });
          }
        }
      });
    });
    return { totalDocuments, pendingReview, approved, actionRequired, attentionItems };
  }, [userActivities]);

  useEffect(() => {
    const fetchUpcomingLaunches = async () => {
      try {
        setIsLoadingUpcomingLaunches(true);
        setUpcomingLaunchError(null);
        const launches = await getNextLaunches(3);
        setUpcomingLaunches(launches);
      } catch (error) {
        console.error("Failed to fetch upcoming launches for dashboard:", error);
        setUpcomingLaunchError(error instanceof Error ? error.message : "An unknown error occurred.");
      }
      setIsLoadingUpcomingLaunches(false);
    };

    const fetchPastSpaceXLaunches = async () => {
      try {
        setIsLoadingSpaceXLaunches(true);
        setSpaceXLaunchError(null);
        const launches = await getPastSpaceXLaunches(3);
        setPastSpaceXLaunches(launches);
      } catch (error) {
        console.error("Failed to fetch SpaceX launches for dashboard:", error);
        setSpaceXLaunchError(error instanceof Error ? error.message : "An unknown error occurred.");
      }
      setIsLoadingSpaceXLaunches(false);
    };

    const fetchSatelliteData = async () => {
      setIsLoadingSatellites(true);
      setSatelliteError(null);
      try {
        const generalSatellites = await getGeneralSatelliteLaunches(15, 2); // Fetch 15, take 2
        setUpcomingGeneralSatellites(generalSatellites);

        const spacexSatellites = await getPastSpaceXSatelliteLaunches(10, 2); // Fetch 10, take 2
        setPastSpaceXSatellites(spacexSatellites);
      } catch (error) {
        console.error("Failed to fetch satellite data for dashboard:", error);
        setSatelliteError(error instanceof Error ? error.message : "An unknown error occurred.");
      }
      setIsLoadingSatellites(false);
    };

    fetchUpcomingLaunches();
    fetchPastSpaceXLaunches();
    fetchSatelliteData();
  }, []);

  const formatGeneralLaunchDate = (launch: RocketLaunch): string => {
    if (launch.win_open) return new Date(launch.win_open).toLocaleDateString();
    if (launch.t0) return new Date(launch.t0).toLocaleDateString();
    if (launch.sort_date) return new Date(parseInt(launch.sort_date, 10) * 1000).toLocaleDateString();
    return launch.date_str || "N/A";
  };

  const formatSpaceXLaunchDate = (launch: SpaceXLaunch): string => {
    return new Date(launch.date_utc).toLocaleDateString();
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

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-center text-primary">Lunargistics Dashboard</h1>

        <div className="mb-12 p-6 bg-base-200 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-secondary">Platform Overview</h2>
          <p className="text-lg">
            Monitoring and managing space exploration, satellite deployments, and rocket launches with a focus on
            industry compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Card 1: Upcoming Launches (General) */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-3 text-secondary">Upcoming Launches</h2>
            {isLoadingUpcomingLaunches && <p className="text-sm opacity-80">Loading...</p>}
            {upcomingLaunchError && <p className="text-sm text-error">Error: {upcomingLaunchError}</p>}
            {!isLoadingUpcomingLaunches &&
              !upcomingLaunchError &&
              (upcomingLaunches.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {upcomingLaunches.map(launch => (
                    <li key={launch.id} className="opacity-80 hover:opacity-100">
                      <Link href={`/launches/general/${launch.id}`} className="hover:underline">
                        <strong>{launch.name}</strong> ({launch.provider.name})<br /> {formatGeneralLaunchDate(launch)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm opacity-80">No upcoming launches found.</p>
              ))}
            <div className="mt-4 h-16 bg-base-300/50 rounded flex items-center justify-center">
              <p className="text-xs opacity-60">General Launch Summary</p>
            </div>
          </div>

          {/* Card 2: Recent SpaceX Launches */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg hover:shadow-accent/50 transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-3 text-accent">Recent SpaceX</h2>
            {isLoadingSpaceXLaunches && <p className="text-sm opacity-80">Loading...</p>}
            {spaceXLaunchError && <p className="text-sm text-error">Error: {spaceXLaunchError}</p>}
            {!isLoadingSpaceXLaunches &&
              !spaceXLaunchError &&
              (pastSpaceXLaunches.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {pastSpaceXLaunches.map(launch => (
                    <li key={launch.id} className="opacity-80 hover:opacity-100">
                      <Link href={`/launches/spacex/${launch.id}`} className="hover:underline">
                        <strong>{launch.name}</strong> - {formatSpaceXLaunchDate(launch)}
                        {launch.success === false && <span className="ml-2 badge badge-error badge-sm">Failed</span>}
                        {launch.success === true && <span className="ml-2 badge badge-success badge-sm">Success</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm opacity-80">No recent SpaceX launches.</p>
              ))}
            <div className="mt-4 h-16 bg-base-300/50 rounded flex items-center justify-center">
              <p className="text-xs opacity-60">SpaceX Launch Summary</p>
            </div>
          </div>

          {/* Card 3: Satellite Deployments */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg hover:shadow-info/50 transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-3 text-info">Satellite Activity</h2>
            {isLoadingSatellites && <p className="text-sm opacity-80">Loading satellite data...</p>}
            {satelliteError && <p className="text-sm text-error">Error: {satelliteError}</p>}
            {!isLoadingSatellites &&
              !satelliteError &&
              (upcomingGeneralSatellites.length > 0 || pastSpaceXSatellites.length > 0 ? (
                <div className="mt-4 space-y-3 text-sm">
                  {upcomingGeneralSatellites.length > 0 && (
                    <div>
                      <h4 className="font-semibold opacity-90 text-xs mb-1">Upcoming General:</h4>
                      <ul className="space-y-1">
                        {upcomingGeneralSatellites.map(launch => (
                          <li key={`gen-sat-${launch.id}`} className="opacity-80 hover:opacity-100">
                            <Link href={`/launches/general/${launch.id}`} className="hover:underline">
                              <strong>{launch.name}</strong> ({launch.provider.name})<br />{" "}
                              {formatGeneralLaunchDate(launch)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pastSpaceXSatellites.length > 0 && (
                    <div>
                      <h4 className="font-semibold opacity-90 text-xs mt-2 mb-1">Recent SpaceX Satellites:</h4>
                      <ul className="space-y-1">
                        {pastSpaceXSatellites.map(launch => (
                          <li key={`spx-sat-${launch.id}`} className="opacity-80 hover:opacity-100">
                            <Link href={`/launches/spacex/${launch.id}`} className="hover:underline">
                              <strong>{launch.name}</strong> - {formatSpaceXLaunchDate(launch)}
                              {launch.success === true && (
                                <span className="ml-1 badge badge-success badge-xs">Deployed</span>
                              )}
                              {launch.success === false && (
                                <span className="ml-1 badge badge-error badge-xs">Failed</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm opacity-80">No specific satellite activity found.</p>
              ))}
            <div className="mt-4 h-16 bg-base-300/50 rounded flex items-center justify-center">
              <p className="text-xs opacity-60">Satellite Deployment Info</p>
            </div>
          </div>

          {/* Card 4: Compliance Dashboard - Updated to handle potentially undefined userActivities */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-3 text-purple-400">Compliance Overview</h2>
            {isLoadingActivities ? (
              <p className="text-sm opacity-80 mt-4">Loading compliance data...</p>
            ) : !userActivities || userActivities.length === 0 ? (
              <p className="text-sm opacity-80 mt-4">Log activities to see compliance status.</p>
            ) : (
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <strong>Total Documents:</strong> {complianceSummary.totalDocuments}
                </p>
                <p>
                  <strong>Pending Review:</strong>{" "}
                  <span className="font-bold text-info">{complianceSummary.pendingReview}</span>
                </p>
                <p>
                  <strong>Approved:</strong>{" "}
                  <span className="font-bold text-success">{complianceSummary.approved}</span>
                </p>
                <p>
                  <strong>Needs Action:</strong>{" "}
                  <span className="font-bold text-warning">{complianceSummary.actionRequired}</span>
                </p>
                {complianceSummary.attentionItems.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-base-300">
                    <h4 className="font-semibold opacity-90 text-xs mb-1">Attention Items:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      {complianceSummary.attentionItems.map(item => (
                        <li key={`${item.activityId}-${item.docName}`} className="opacity-80">
                          <Link href={`/activities/${item.activityId}`} className="hover:underline">
                            {item.activityName} - {item.docName}:{" "}
                            <span className={`badge badge-xs ${getComplianceStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 h-16 bg-base-300/50 rounded flex items-center justify-center">
              <p className="text-xs opacity-60">User Activity Compliance</p>
            </div>
          </div>
        </div>

        {/* Activity Feed Table - currently uses RocketLaunch.live data */}
        <div className="mt-12 bg-base-200 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Activity Feed (Upcoming General Launches)</h2>
          {isLoadingUpcomingLaunches && <p>Loading launch data for feed...</p>}
          {upcomingLaunchError && <p className="text-error">Error loading launch data: {upcomingLaunchError}</p>}
          {!isLoadingUpcomingLaunches && !upcomingLaunchError && (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="bg-base-300">Launch Name</th>
                    <th className="bg-base-300">Provider</th>
                    <th className="bg-base-300">Vehicle</th>
                    <th className="bg-base-300">Date</th>
                    <th className="bg-base-300">Location</th>
                    <th className="bg-base-300">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingLaunches.map(launch => (
                    <tr key={launch.id}>
                      <td>{launch.name}</td>
                      <td>{launch.provider.name}</td>
                      <td>{launch.vehicle.name}</td>
                      <td>{formatGeneralLaunchDate(launch)}</td>
                      <td>{launch.pad.location.name}</td>
                      <td>
                        <Link href={`/launches/general/${launch.id}`} className="btn btn-xs btn-outline btn-primary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {upcomingLaunches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center">
                        No upcoming launches to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
