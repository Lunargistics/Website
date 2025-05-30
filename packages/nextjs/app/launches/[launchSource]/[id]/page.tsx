"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { NextPage } from "next";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { RocketLaunch, getLaunchById } from "~~/services/launchApiService";
import { SpaceXLaunch, getSpaceXLaunchById } from "~~/services/spacexApiService";

const LaunchDetailPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const launchSource = params.launchSource as string;
  const id = params.id as string;

  const [launchData, setLaunchData] = useState<RocketLaunch | SpaceXLaunch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !launchSource) return;

    const fetchLaunchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let data;
        if (launchSource === "general") {
          data = await getLaunchById(id);
        } else if (launchSource === "spacex") {
          data = await getSpaceXLaunchById(id);
        } else {
          throw new Error("Invalid launch source specified.");
        }

        if (data) {
          setLaunchData(data);
        } else {
          setError("Launch details not found.");
        }
      } catch (err) {
        console.error("Error fetching launch details:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      }
      setIsLoading(false);
    };

    fetchLaunchDetails();
  }, [id, launchSource]);

  // Helper to render common launch details
  const renderCommonDetails = (launch: RocketLaunch | SpaceXLaunch) => {
    const isSpaceX = "flight_number" in launch; // Differentiator for SpaceXLaunch
    const generalLaunch = launch as RocketLaunch;
    const spacexLaunch = launch as SpaceXLaunch;

    return (
      <>
        <p className="text-lg mb-2">
          <strong>Date:</strong>{" "}
          {isSpaceX
            ? new Date(spacexLaunch.date_utc).toLocaleString()
            : new Date(
                generalLaunch.win_open || generalLaunch.t0 || parseInt(generalLaunch.sort_date, 10) * 1000,
              ).toLocaleString()}
        </p>
        {isSpaceX ? (
          <>
            <p>
              <strong>Flight Number:</strong> {spacexLaunch.flight_number}
            </p>
            <p>
              <strong>Success:</strong> {spacexLaunch.success === null ? "N/A" : spacexLaunch.success ? "Yes" : "No"}
            </p>
            {spacexLaunch.details && (
              <p className="mt-4">
                <strong>Details:</strong> {spacexLaunch.details}
              </p>
            )}
            {spacexLaunch.links.webcast && (
              <p className="mt-2">
                <strong>Webcast:</strong>{" "}
                <a
                  href={spacexLaunch.links.webcast}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Watch here
                </a>
              </p>
            )}
            {spacexLaunch.links.article && (
              <p>
                <strong>Article:</strong>{" "}
                <a
                  href={spacexLaunch.links.article}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Read more
                </a>
              </p>
            )}
            {spacexLaunch.links.wikipedia && (
              <p>
                <strong>Wikipedia:</strong>{" "}
                <a
                  href={spacexLaunch.links.wikipedia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Learn more
                </a>
              </p>
            )}
          </>
        ) : (
          <>
            <p>
              <strong>Provider:</strong> {generalLaunch.provider.name}
            </p>
            <p>
              <strong>Vehicle:</strong> {generalLaunch.vehicle.name}
            </p>
            <p>
              <strong>Pad:</strong> {generalLaunch.pad.name} ({generalLaunch.pad.location.name})
            </p>
            {generalLaunch.launch_description && (
              <p className="mt-4">
                <strong>Launch Description:</strong> {generalLaunch.launch_description}
              </p>
            )}
            {generalLaunch.mission_description && (
              <p className="mt-2">
                <strong>Mission Description:</strong> {generalLaunch.mission_description}
              </p>
            )}
            {generalLaunch.missions && generalLaunch.missions.length > 0 && (
              <div className="mt-2">
                <strong>Missions:</strong>
                <ul className="list-disc list-inside ml-4">
                  {generalLaunch.missions.map(m => (
                    <li key={m.id}>
                      {m.name} {m.description ? `- ${m.description}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {generalLaunch.quicktext && generalLaunch.quicktext.includes("https://rocketlaunch.live/launch/") && (
              <p className="mt-2">
                <strong>More Info:</strong>{" "}
                <a
                  href={`https://rocketlaunch.live/launch/${generalLaunch.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  View on RocketLaunch.Live
                </a>
              </p>
            )}
          </>
        )}
      </>
    );
  };

  if (isLoading) {
    return <div className="container mx-auto p-6 text-center">Loading launch details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-6 text-center text-error">Error: {error}</div>;
  }

  if (!launchData) {
    return <div className="container mx-auto p-6 text-center">No launch data available.</div>;
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm mb-6 text-primary hover:bg-primary/10">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-base-200 p-6 sm:p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-primary">{launchData.name}</h1>
          {renderCommonDetails(launchData)}
        </div>
      </div>
    </div>
  );
};

export default LaunchDetailPage;
