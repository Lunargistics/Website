export interface RocketLaunchLocation {
  name: string;
  state: string | null;
  statename: string | null;
  country: string;
  slug: string;
}

export interface RocketLaunchPad {
  id: number;
  name: string;
  location: RocketLaunchLocation;
}

export interface RocketLaunchProvider {
  id: number;
  name: string;
  slug: string;
}

export interface RocketLaunchVehicle {
  id: number;
  name: string;
  company_id: number;
  slug: string;
}

export interface RocketLaunchMission {
  id: number;
  name: string;
  description: string | null;
}

export interface RocketLaunch {
  id: number;
  cospar_id: string | null;
  sort_date: string;
  name: string;
  provider: RocketLaunchProvider;
  vehicle: RocketLaunchVehicle;
  pad: RocketLaunchPad;
  missions: RocketLaunchMission[];
  mission_description: string | null;
  launch_description: string;
  win_open: string | null;
  t0: string | null;
  win_close: string | null;
  est_date: {
    month: number | null;
    day: number | null;
    year: number | null;
    quarter: number | null;
  };
  date_str: string;
  tags: Array<{ id: number; text: string }>;
  slug: string;
  weather_summary: string | null;
  weather_temp: number | null;
  weather_condition: string | null;
  weather_wind_mph: number | null;
  weather_icon: string | null;
  weather_updated: string | null;
  quicktext: string;
  media: any[]; // You might want to define a more specific type if you use this
  result: number | null; // -1 for estimated/unknown, 0 for failure, 1 for success (based on typical API patterns)
  suborbital: boolean;
  modified: string;
}

export interface RocketLaunchResponse {
  valid_auth: boolean;
  count: number;
  limit: number;
  total: number;
  last_page: number;
  result: RocketLaunch[];
}

const API_BASE_URL = "https://fdo.rocketlaunch.live/json";

export const getNextLaunches = async (count: number = 5): Promise<RocketLaunch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/launches/next/${count}`);
    if (!response.ok) {
      console.error("Failed to fetch launches:", response.status, await response.text());
      throw new Error(`Failed to fetch launches: ${response.status}`);
    }
    const data: RocketLaunchResponse = await response.json();
    if (!data || !data.result) {
      console.error("Invalid data structure from launch API:", data);
      throw new Error("Invalid data structure from launch API");
    }
    return data.result;
  } catch (error) {
    console.error("Error in getNextLaunches:", error);
    // Return an empty array or re-throw, depending on how you want to handle errors upstream
    return [];
  }
};

const SATELLITE_KEYWORDS = [
  "satellite",
  "starlink",
  "constellation",
  "comms",
  "communication",
  "imaging",
  "orbiter",
  "payloads",
  "cubesat",
  "smallsat",
  "geo",
  "leo",
  "earth observation",
  "gps",
  "glonass",
  "galileo",
  "beidou",
  "iridium",
  "oneweb",
];

const SATELLITE_TAGS = [
  "earth observation satellite",
  "communications satellite",
  "navigation satellite",
  "starlink",
  "gps",
  "cubesat",
];

// Helper to check if a launch is likely a satellite deployment
const isSatelliteMission = (launch: RocketLaunch): boolean => {
  const lowerCaseName = launch.name.toLowerCase();
  const lowerCaseLaunchDesc = launch.launch_description?.toLowerCase() || "";
  const lowerCaseMissionDesc = launch.mission_description?.toLowerCase() || "";

  if (
    SATELLITE_KEYWORDS.some(
      keyword =>
        lowerCaseName.includes(keyword) ||
        lowerCaseLaunchDesc.includes(keyword) ||
        lowerCaseMissionDesc.includes(keyword),
    )
  ) {
    return true;
  }

  if (
    launch.missions &&
    launch.missions.some(mission => {
      const lowerMissionName = mission.name.toLowerCase();
      const lowerMissionDesc = mission.description?.toLowerCase() || "";
      return SATELLITE_KEYWORDS.some(
        keyword => lowerMissionName.includes(keyword) || lowerMissionDesc.includes(keyword),
      );
    })
  ) {
    return true;
  }

  if (launch.tags && launch.tags.some(tag => SATELLITE_TAGS.includes(tag.text.toLowerCase()))) {
    return true;
  }

  // Specific check for Starlink as it's very common
  if (
    lowerCaseName.includes("starlink") ||
    (launch.provider.name === "SpaceX" && lowerCaseName.match(/starlink|starlin|strlnk/i))
  ) {
    return true;
  }

  return false;
};

/**
 * Fetches upcoming launches and filters for likely satellite deployments.
 * @param count Number of general launches to fetch and then filter from.
 * @param limit_satellites Max number of satellite missions to return.
 * @returns A promise that resolves to an array of RocketLaunch objects identified as satellite deployments.
 */
export const getUpcomingSatelliteDeployments = async (
  count: number = 20,
  limit_satellites: number = 3,
): Promise<RocketLaunch[]> => {
  try {
    const allUpcomingLaunches = await getNextLaunches(count);
    const satelliteMissions = allUpcomingLaunches.filter(isSatelliteMission);
    return satelliteMissions.slice(0, limit_satellites);
  } catch (error) {
    console.error("Error in getUpcomingSatelliteDeployments:", error);
    return [];
  }
};

/**
 * Fetches a single launch by its ID from RocketLaunch.live.
 * @param id The ID of the launch to fetch.
 * @returns A promise that resolves to a RocketLaunch object or null if not found/error.
 */
export const getLaunchById = async (id: number | string): Promise<RocketLaunch | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/launch/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Launch with ID ${id} not found on RocketLaunch.live.`);
        return null;
      }
      console.error(`Failed to fetch launch ${id}:`, response.status, await response.text());
      throw new Error(`Failed to fetch launch ${id}: ${response.status}`);
    }
    // The API for a single launch returns the launch object directly, not nested in a 'result' array.
    // However, the structure in the docs (https://fdo.rocketlaunch.live/json/launch/{{id}}) shows it *is* nested in a 'result' array of one item.
    // And the main /launches/next/5 is also nested. Let's assume it's nested for consistency or handle both.
    const data = await response.json();

    // Check if data.result is an array and has items, or if data itself is the launch object (less likely based on other endpoints)
    if (data && data.result && Array.isArray(data.result) && data.result.length > 0) {
      return data.result[0] as RocketLaunch;
    } else if (data && !Array.isArray(data) && data.id) {
      // Fallback: if the API returns the object directly (less likely)
      return data as RocketLaunch;
    }

    console.warn(`Launch data for ID ${id} received in unexpected format:`, data);
    return null;
  } catch (error) {
    console.error(`Error in getLaunchById (ID: ${id}):`, error);
    return null;
  }
};
