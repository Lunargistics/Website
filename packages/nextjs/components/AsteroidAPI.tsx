"use client";

import { useCallback, useEffect, useState } from "react";
import { notification } from "~~/utils/scaffold-eth";

interface AsteroidData {
  id: string;
  name: string;
  estimated_value: string;
  diameter: number;
  composition: {
    iron: number;
    nickel: number;
    cobalt: number;
    platinum: number;
    gold: number;
  };
}

export function AsteroidDataFetcher() {
  const [asteroids, setAsteroids] = useState<AsteroidData[]>([]);
  const [loading, setLoading] = useState(false);

  // Note: Oracle contract integration is only available on local Hardhat network
  // For production, this component displays mock data only

  const fetchAsteroidData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call to asterrank.com
      const mockAsteroids: AsteroidData[] = [
        {
          id: "16-psyche",
          name: "16 Psyche",
          estimated_value: "10000000000000000",
          diameter: 226000,
          composition: {
            iron: 45,
            nickel: 25,
            cobalt: 15,
            platinum: 10,
            gold: 5,
          },
        },
        {
          id: "433-eros",
          name: "433 Eros",
          estimated_value: "20000000000000",
          diameter: 16840,
          composition: {
            iron: 30,
            nickel: 20,
            cobalt: 20,
            platinum: 20,
            gold: 10,
          },
        },
        {
          id: "3554-amun",
          name: "3554 Amun",
          estimated_value: "8000000000000",
          diameter: 2480,
          composition: {
            iron: 40,
            nickel: 30,
            cobalt: 15,
            platinum: 10,
            gold: 5,
          },
        },
      ];

      setAsteroids(mockAsteroids);

      // Note: In production, this would fetch from a real API
      // Oracle updates are only available on local Hardhat network
      notification.success("Asteroid data loaded");
    } catch (error) {
      console.error("Failed to fetch asteroid data:", error);
      notification.error("Failed to update asteroid data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-fetch on component mount
    fetchAsteroidData();
  }, [fetchAsteroidData]);

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          Asteroid Data
          <span className="badge badge-info badge-sm">Mock Data</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Asteroid</th>
                <th>Est. Value</th>
                <th>Diameter (m)</th>
                <th>Composition</th>
              </tr>
            </thead>
            <tbody>
              {asteroids.map(asteroid => (
                <tr key={asteroid.id}>
                  <td>
                    <div>
                      <div className="font-bold">{asteroid.name}</div>
                      <div className="text-sm opacity-50">{asteroid.id}</div>
                    </div>
                  </td>
                  <td>${(parseInt(asteroid.estimated_value) / 1e15).toFixed(0)}T</td>
                  <td>{asteroid.diameter.toLocaleString()}</td>
                  <td>
                    <div className="flex gap-1">
                      {Object.entries(asteroid.composition).map(([element, percentage]) => (
                        <span key={element} className="badge badge-sm">
                          {element}: {percentage}%
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-actions justify-end">
          <button
            className={`btn btn-primary ${loading ? "loading" : ""}`}
            onClick={fetchAsteroidData}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
