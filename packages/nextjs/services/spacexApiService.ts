// Base URL for SpaceX API v4
const API_SPACEX_BASE_URL = "https://api.spacexdata.com/v4";

// Interfaces based on the SpaceX API documentation (partial for brevity)
// We'll focus on launches first.

export interface SpaceXFairings {
  reused: boolean | null;
  recovery_attempt: boolean | null;
  recovered: boolean | null;
  ships: string[];
}

export interface SpaceXLinks {
  patch: {
    small: string | null;
    large: string | null;
  };
  reddit: {
    campaign: string | null;
    launch: string | null;
    media: string | null;
    recovery: string | null;
  };
  flickr: {
    small: string[];
    original: string[];
  };
  presskit: string | null;
  webcast: string | null;
  youtube_id: string | null;
  article: string | null;
  wikipedia: string | null;
}

export interface SpaceXCore {
  core: string | null;
  flight: number | null;
  gridfins: boolean | null;
  legs: boolean | null;
  reused: boolean | null;
  landing_attempt: boolean | null;
  landing_success: boolean | null;
  landing_type: string | null;
  landpad: string | null;
}

export interface SpaceXLaunch {
  fairings: SpaceXFairings | null;
  links: SpaceXLinks;
  static_fire_date_utc: string | null;
  static_fire_date_unix: number | null;
  net: boolean;
  window: number | null;
  rocket: string; // Rocket ID
  success: boolean | null;
  failures: Array<{
    time: number;
    altitude: number | null;
    reason: string;
  }>;
  details: string | null;
  crew: string[]; // Array of crew member IDs
  ships: string[]; // Array of ship IDs
  capsules: string[]; // Array of capsule IDs
  payloads: string[]; // Array of payload IDs
  launchpad: string; // Launchpad ID
  flight_number: number;
  name: string;
  date_utc: string;
  date_unix: number;
  date_local: string;
  date_precision: "half" | "quarter" | "year" | "month" | "day" | "hour";
  upcoming: boolean;
  cores: SpaceXCore[];
  auto_update: boolean;
  tbd: boolean;
  launch_library_id: string | null;
  id: string; // Launch ID
}

const SPACEX_SATELLITE_KEYWORDS = [
  "starlink",
  "satellite",
  "constellation",
  "payload",
  "orbiter",
  "gps",
  // Can add more SpaceX specific keywords if needed
];

// Helper to check if a SpaceX launch is likely a satellite deployment
const isSpaceXSatelliteMission = (launch: SpaceXLaunch): boolean => {
  const lowerCaseName = launch.name.toLowerCase();
  const lowerCaseDetails = launch.details?.toLowerCase() || "";

  if (
    SPACEX_SATELLITE_KEYWORDS.some(keyword => lowerCaseName.includes(keyword) || lowerCaseDetails.includes(keyword))
  ) {
    return true;
  }

  // If payloads are populated and contain relevant info, that could be checked here.
  // For now, name and details are primary checks.
  // Example: launch.payloads.some(payload => payload.type === "Satellite") if such data is available and populated.

  return false;
};

/**
 * Fetches the most recent past SpaceX launches.
 * @param limit Number of past launches to fetch.
 * @returns A promise that resolves to an array of SpaceXLaunch objects.
 */
export const getPastSpaceXLaunches = async (limit: number = 5): Promise<SpaceXLaunch[]> => {
  try {
    // The API returns launches in ascending order by flight_number.
    // To get the latest, we fetch all and then slice the end, or use query options if available.
    // For simplicity with 'limit', we'll fetch and sort client-side or rely on default sort order if it's descending.
    // The docs mention POST for querying, so a simple GET /past might be too much.
    // Let's try GET /launches/query with options for sorting and limiting for efficiency.

    const queryBody = {
      query: { upcoming: false }, // Get past launches
      options: {
        limit: limit,
        sort: { flight_number: "desc" }, // Get the latest ones
        populate: ["rocket", "launchpad"], // Example: if we want to populate related data
      },
    };

    const response = await fetch(`${API_SPACEX_BASE_URL}/launches/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryBody),
    });

    if (!response.ok) {
      console.error("Failed to fetch SpaceX launches:", response.status, await response.text());
      throw new Error(`Failed to fetch SpaceX launches: ${response.status}`);
    }

    // The query endpoint returns an object with a 'docs' array
    const data = await response.json();
    if (!data || !data.docs) {
      console.error("Invalid data structure from SpaceX API (query):", data);
      throw new Error("Invalid data structure from SpaceX API (query)");
    }
    return data.docs as SpaceXLaunch[];
  } catch (error) {
    console.error("Error in getPastSpaceXLaunches:", error);
    return [];
  }
};

/**
 * Fetches recent past SpaceX launches and filters for likely satellite deployments.
 * @param fetch_limit Number of general past SpaceX launches to fetch and then filter from.
 * @param return_limit Max number of satellite missions to return.
 * @returns A promise that resolves to an array of SpaceXLaunch objects identified as satellite deployments.
 */
export const getPastSpaceXSatelliteLaunches = async (
  fetch_limit: number = 10,
  return_limit: number = 3,
): Promise<SpaceXLaunch[]> => {
  try {
    const allPastLaunches = await getPastSpaceXLaunches(fetch_limit);
    // Filter out launches that are clearly not satellite missions or are upcoming (though getPastSpaceXLaunches should handle upcoming:false)
    const satelliteMissions = allPastLaunches.filter(launch => !launch.upcoming && isSpaceXSatelliteMission(launch));
    return satelliteMissions.slice(0, return_limit);
  } catch (error) {
    console.error("Error in getPastSpaceXSatelliteLaunches:", error);
    return [];
  }
};

/**
 * Fetches a single SpaceX launch by its ID.
 * @param id The ID of the SpaceX launch to fetch.
 * @returns A promise that resolves to a SpaceXLaunch object or null if not found/error.
 */
export const getSpaceXLaunchById = async (id: string): Promise<SpaceXLaunch | null> => {
  try {
    // It's possible we might want to populate related fields like rocket, launchpad, payloads for a detailed view.
    // The GET /launches/{id} endpoint might not populate these by default.
    // If needed, we could use the POST /launches/query with a specific ID and populate options.
    // For now, let's try the direct GET request.

    const response = await fetch(`${API_SPACEX_BASE_URL}/launches/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`SpaceX launch with ID ${id} not found.`);
        return null;
      }
      console.error(`Failed to fetch SpaceX launch ${id}:`, response.status, await response.text());
      throw new Error(`Failed to fetch SpaceX launch ${id}: ${response.status}`);
    }

    const data: SpaceXLaunch = await response.json();
    if (!data || !data.id) {
      // Basic check to see if we got a launch object
      console.warn(`SpaceX launch data for ID ${id} received in unexpected format or is empty:`, data);
      return null;
    }
    return data;
  } catch (error) {
    console.error(`Error in getSpaceXLaunchById (ID: ${id}):`, error);
    return null;
  }
};
