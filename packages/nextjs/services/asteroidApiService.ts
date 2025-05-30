// Base URL for Asterank API
const API_ASTERANK_BASE_URL = "https://www.asterank.com/api/asterank";

// Interface for an Asteroid object based on typical Asterank API responses
// This is a simplified version; the actual API returns many more fields.
export interface Asteroid {
  id: string; // Unique ID for the asteroid in Asterank
  full_name: string; // Full name, often includes designation e.g., "(2001 FO32)"
  name: string | null; // Proper name if it has one, e.g., "Apophis"
  designation: string | null; // Provisional designation, e.g., "2001 FO32"

  diameter: number | null; // Diameter in meters
  albedo: number | null; // Reflectivity
  e: number | null; // Eccentricity
  a: number | null; // Semi-major axis (AU)
  q: number | null; // Perihelion distance (AU)
  ad: number | null; // Aphelion distance (AU)
  om: number | null; // Longitude of ascending node (degrees)
  w: number | null; // Argument of perihelion (degrees)
  ma: number | null; // Mean anomaly (degrees)
  per_y: number | null; // Orbital period in years
  moid_au: number | null; // Earth Minimum Orbit Intersection Distance (AU)

  price: number | null; // Estimated value (theoretical, from Asterank)
  profit: number | null; // Estimated profit (theoretical)

  spec: string | null; // Spectral type (e.g., "C", "S", "M")
  producer: string | null; // Producer (usually MPC)

  updated: string | null; // Last update timestamp
  // Add other fields as needed from the API docs: GM, BV, UB, IRLin, sigma_e, etc.
}

/**
 * Fetches asteroids based on a query.
 * @param query MongoDB-style query object (e.g., {"diameter":{"$gt":1000}})
 * @param limit Number of asteroids to fetch.
 * @returns A promise that resolves to an array of Asteroid objects.
 */
export const getAsteroids = async (query: object, limit: number = 5): Promise<Asteroid[]> => {
  try {
    const queryString = encodeURIComponent(JSON.stringify(query));
    const url = `${API_ASTERANK_BASE_URL}?query=${queryString}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch asteroids:", response.status, await response.text());
      throw new Error(`Failed to fetch asteroids: ${response.status}`);
    }

    const data: Asteroid[] = await response.json(); // The API returns an array directly
    if (!data) {
      console.error("Invalid data structure from Asterank API:", data);
      throw new Error("Invalid data structure from Asterank API");
    }
    return data;
  } catch (error) {
    console.error("Error in getAsteroids:", error);
    return [];
  }
};

/**
 * Fetches a few recently updated or notable asteroids.
 * For example, those updated today or with a large diameter.
 */
export const getNotableAsteroids = async (limit: number = 3): Promise<Asteroid[]> => {
  // Example query: asteroids with diameter > 500m, sorted by last update (descending)
  // The Asterank API doesn't directly support sorting in the query parameters from what I can see in the basic docs.
  // Sorting might need to be done client-side or by using more specific queries if certain fields allow it.
  // Let's try to get asteroids with a significant Moid (Earth Minimum Orbit Intersection Distance) that are somewhat large.
  const query = {
    moid_au: { $lt: 0.05 }, // Potentially Earth-approaching (within 0.05 AU)
    diameter: { $gt: 100 }, // Diameter greater than 100 meters
  };
  // Alternatively, for "daily_updated", the API docs mention it as a field.
  // We might need to adjust the query if the above doesn't yield good results or if a better query for "notable" is found.
  // const queryDaily = { "daily_updated": true }; // This might be how it works, or based on a date field.

  return getAsteroids(query, limit);
};
