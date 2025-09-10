"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, ClockIcon, MapPinIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

interface LaunchData {
  id: string;
  name: string;
  date: string;
  location: string;
  status: "upcoming" | "successful" | "failed" | "in-progress";
  rocket: string;
  mission: string;
}

export const LaunchesDashboard = () => {
  const [launches, setLaunches] = useState<LaunchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading launch data
    setTimeout(() => {
      setLaunches([
        {
          id: "1",
          name: "Artemis III",
          date: "2026-09-15",
          location: "Kennedy Space Center",
          status: "upcoming",
          rocket: "SLS Block 1B",
          mission: "Lunar Landing Mission",
        },
        {
          id: "2",
          name: "Starship IFT-4",
          date: "2024-06-06",
          location: "Starbase, TX",
          status: "successful",
          rocket: "Starship",
          mission: "Integrated Flight Test",
        },
        {
          id: "3",
          name: "Europa Clipper",
          date: "2024-10-14",
          location: "Kennedy Space Center",
          status: "successful",
          rocket: "Falcon Heavy",
          mission: "Jupiter Moon Exploration",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "successful":
        return "text-green-400 bg-green-900/20 border-green-700";
      case "failed":
        return "text-red-400 bg-red-900/20 border-red-700";
      case "in-progress":
        return "text-blue-400 bg-blue-900/20 border-blue-700";
      case "upcoming":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-700";
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading launch data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
          <div className="flex items-center">
            <RocketLaunchIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-white">{launches.length}</p>
              <p className="text-gray-400">Total Launches</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-white">{launches.filter(l => l.status === "successful").length}</p>
              <p className="text-gray-400">Successful</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-white">{launches.filter(l => l.status === "upcoming").length}</p>
              <p className="text-gray-400">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      {/* Launches List */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Recent & Upcoming Launches</h3>
        </div>
        <div className="divide-y divide-gray-700">
          {launches.map(launch => (
            <div key={launch.id} className="p-6 hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-white">{launch.name}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(launch.status)}`}
                    >
                      {launch.status.replace("-", " ").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">{launch.mission}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-400">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatDate(launch.date)}
                    </div>
                    <div className="flex items-center text-gray-400">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {launch.location}
                    </div>
                    <div className="flex items-center text-gray-400">
                      <RocketLaunchIcon className="h-4 w-4 mr-2" />
                      {launch.rocket}
                    </div>
                  </div>
                </div>
                <button className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Notice */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-700/50 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">Launch Data Integration</h3>
        <p className="text-gray-300 mb-4">
          Connect with SpaceX API, NASA Launch Services, and other providers for real-time launch tracking and
          notifications.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
            Configure APIs
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
            Set Notifications
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};
