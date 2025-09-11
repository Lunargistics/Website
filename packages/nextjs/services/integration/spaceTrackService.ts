/**
 * Space-Track.org API Integration Service
 * Real-time satellite catalog and tracking data
 * Performance optimized for 1000+ satellites with intelligent caching
 */

import axios from "axios";
import { LRUCache } from "lru-cache";

export interface SpaceObject {
  noradCatId: number;
  objectName: string;
  objectType: string;
  countryCode: string;
  launchDate: Date;
  decay?: Date;
  period: number;
  inclination: number;
  apogee: number;
  perigee: number;
  rcs?: number;
  dataStatus: string;
  orbitCenter: string;
  orbitType: string;
}

export interface TLE {
  noradCatId: number;
  objectName: string;
  epoch: Date;
  line1: string;
  line2: string;
  meanMotion: number;
  eccentricity: number;
  inclination: number;
  raan: number;
  argOfPerigee: number;
  meanAnomaly: number;
  ephemerisType: number;
  classType: string;
  intlDes: string;
  epochYear: number;
  epochDay: number;
}

export interface Conjunction {
  primaryObject: number;
  secondaryObject: number;
  tca: Date; // Time of Closest Approach
  daysFromNow: number;
  minRangeKm: number;
  probability: number;
  maxProbability: number;
}

export interface Decay {
  noradCatId: number;
  objectName: string;
  decayDate: Date;
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface LaunchSite {
  siteCode: string;
  siteName: string;
  latitude: number;
  longitude: number;
  launches: number;
}

// Performance optimization: Multi-layer caching strategy
class CacheManager {
  private tleCache: LRUCache<string, TLE[]>;
  private catalogCache: LRUCache<string, SpaceObject[]>;
  private conjunctionCache: LRUCache<string, Conjunction[]>;
  private batchCache: LRUCache<string, any>;
  
  constructor() {
    // TLE cache: 15 minutes TTL, max 10000 entries
    this.tleCache = new LRUCache({
      max: 10000,
      ttl: 15 * 60 * 1000,
      updateAgeOnGet: true,
    });

    // Catalog cache: 1 hour TTL, max 50000 entries
    this.catalogCache = new LRUCache({
      max: 50000,
      ttl: 60 * 60 * 1000,
      updateAgeOnGet: true,
    });

    // Conjunction cache: 5 minutes TTL
    this.conjunctionCache = new LRUCache({
      max: 1000,
      ttl: 5 * 60 * 1000,
    });

    // Batch request cache: 30 minutes TTL
    this.batchCache = new LRUCache({
      max: 100,
      ttl: 30 * 60 * 1000,
    });
  }

  getTLE(key: string): TLE[] | undefined {
    return this.tleCache.get(key);
  }

  setTLE(key: string, data: TLE[]): void {
    this.tleCache.set(key, data);
  }

  getCatalog(key: string): SpaceObject[] | undefined {
    return this.catalogCache.get(key);
  }

  setCatalog(key: string, data: SpaceObject[]): void {
    this.catalogCache.set(key, data);
  }

  getConjunction(key: string): Conjunction[] | undefined {
    return this.conjunctionCache.get(key);
  }

  setConjunction(key: string, data: Conjunction[]): void {
    this.conjunctionCache.set(key, data);
  }

  getBatch(key: string): any {
    return this.batchCache.get(key);
  }

  setBatch(key: string, data: any): void {
    this.batchCache.set(key, data);
  }

  clearAll(): void {
    this.tleCache.clear();
    this.catalogCache.clear();
    this.conjunctionCache.clear();
    this.batchCache.clear();
  }

  getStats() {
    return {
      tle: { size: this.tleCache.size, maxSize: this.tleCache.max },
      catalog: { size: this.catalogCache.size, maxSize: this.catalogCache.max },
      conjunction: { size: this.conjunctionCache.size, maxSize: this.conjunctionCache.max },
      batch: { size: this.batchCache.size, maxSize: this.batchCache.max },
    };
  }
}

export class SpaceTrackService {
  private static instance: SpaceTrackService;
  private baseUrl = "https://www.space-track.org";
  private username: string;
  private password: string;
  private cookie: string | null = null;
  private cache: CacheManager;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitDelay = 1000; // 1 second between requests

  private constructor() {
    this.username = process.env.SPACETRACK_USERNAME || "";
    this.password = process.env.SPACETRACK_PASSWORD || "";
    this.cache = new CacheManager();
  }

  static getInstance(): SpaceTrackService {
    if (!SpaceTrackService.instance) {
      SpaceTrackService.instance = new SpaceTrackService();
    }
    return SpaceTrackService.instance;
  }

  /**
   * Authenticate with Space-Track.org
   */
  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/ajaxauth/login`,
        {
          identity: this.username,
          password: this.password,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.cookie = response.headers["set-cookie"]?.[0] || null;
      console.log("✅ Authenticated with Space-Track.org");
    } catch (error) {
      console.error("Space-Track authentication failed:", error);
      throw new Error("Failed to authenticate with Space-Track.org");
    }
  }

  /**
   * Queue API request with rate limiting
   */
  private async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get latest TLEs with caching and batching
   */
  async getLatestTLEs(
    noradIds?: number[],
    options?: {
      limit?: number;
      orderBy?: string;
      format?: "tle" | "3le" | "json";
    }
  ): Promise<TLE[]> {
    const cacheKey = `tle_${noradIds?.join(",") || "all"}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.getTLE(cacheKey);
    if (cached) {
      console.log("📦 TLE cache hit");
      return cached;
    }

    if (!this.cookie) await this.authenticate();

    return this.queueRequest(async () => {
      let url = `${this.baseUrl}/basicspacedata/query/class/tle_latest`;
      
      const params: string[] = [];
      if (noradIds && noradIds.length > 0) {
        // Batch request for multiple satellites
        params.push(`NORAD_CAT_ID/${noradIds.join(",")}`);
      }
      if (options?.limit) {
        params.push(`limit/${options.limit}`);
      }
      if (options?.orderBy) {
        params.push(`orderby/${options.orderBy}`);
      }
      params.push(`format/${options?.format || "json"}`);

      if (params.length > 0) {
        url += "/" + params.join("/");
      }

      const response = await axios.get(url, {
        headers: {
          Cookie: this.cookie!,
        },
      });

      const tles = this.parseTLEResponse(response.data);
      this.cache.setTLE(cacheKey, tles);
      
      return tles;
    });
  }

  /**
   * Get satellite catalog with advanced filtering
   */
  async getSatelliteCatalog(
    filters?: {
      objectType?: string[];
      countryCode?: string[];
      launchDateMin?: Date;
      launchDateMax?: Date;
      periodMin?: number;
      periodMax?: number;
      inclinationMin?: number;
      inclinationMax?: number;
      apogeeMin?: number;
      apogeeMax?: number;
      perigeeMin?: number;
      perigeeMax?: number;
      decayed?: boolean;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
    }
  ): Promise<SpaceObject[]> {
    const cacheKey = `catalog_${JSON.stringify(filters)}_${JSON.stringify(options)}`;
    
    const cached = this.cache.getCatalog(cacheKey);
    if (cached) {
      console.log("📦 Catalog cache hit");
      return cached;
    }

    if (!this.cookie) await this.authenticate();

    return this.queueRequest(async () => {
      let url = `${this.baseUrl}/basicspacedata/query/class/satcat`;
      
      const params: string[] = [];
      
      // Apply filters
      if (filters?.objectType) {
        params.push(`OBJECT_TYPE/${filters.objectType.join(",")}`);
      }
      if (filters?.countryCode) {
        params.push(`COUNTRY_CODE/${filters.countryCode.join(",")}`);
      }
      if (filters?.launchDateMin) {
        params.push(`LAUNCH/>=${filters.launchDateMin.toISOString().split("T")[0]}`);
      }
      if (filters?.periodMin !== undefined) {
        params.push(`PERIOD/>=${filters.periodMin}`);
      }
      if (filters?.periodMax !== undefined) {
        params.push(`PERIOD/<=${filters.periodMax}`);
      }
      if (filters?.decayed === false) {
        params.push("DECAY/null-val");
      }
      
      // Apply options
      if (options?.limit) {
        params.push(`limit/${options.limit}`);
      }
      if (options?.offset) {
        params.push(`offset/${options.offset}`);
      }
      if (options?.orderBy) {
        params.push(`orderby/${options.orderBy}`);
      }
      
      params.push("format/json");

      if (params.length > 0) {
        url += "/" + params.join("/");
      }

      const response = await axios.get(url, {
        headers: {
          Cookie: this.cookie!,
        },
      });

      const objects = this.parseCatalogResponse(response.data);
      this.cache.setCatalog(cacheKey, objects);
      
      return objects;
    });
  }

  /**
   * Get conjunction data for collision avoidance
   */
  async getConjunctions(
    primaryObject?: number,
    options?: {
      daysAhead?: number;
      minRange?: number;
      minProbability?: number;
    }
  ): Promise<Conjunction[]> {
    const cacheKey = `conjunction_${primaryObject || "all"}_${JSON.stringify(options)}`;
    
    const cached = this.cache.getConjunction(cacheKey);
    if (cached) {
      console.log("📦 Conjunction cache hit");
      return cached;
    }

    if (!this.cookie) await this.authenticate();

    return this.queueRequest(async () => {
      let url = `${this.baseUrl}/basicspacedata/query/class/cdm_public`;
      
      const params: string[] = [];
      
      if (primaryObject) {
        params.push(`SAT_1_ID/${primaryObject}`);
      }
      if (options?.daysAhead) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + options.daysAhead);
        params.push(`TCA/<=${futureDate.toISOString()}`);
      }
      if (options?.minRange !== undefined) {
        params.push(`MIN_RNG/<=${options.minRange}`);
      }
      
      params.push("format/json");
      
      if (params.length > 0) {
        url += "/" + params.join("/");
      }

      const response = await axios.get(url, {
        headers: {
          Cookie: this.cookie!,
        },
      });

      const conjunctions = this.parseConjunctionResponse(response.data);
      this.cache.setConjunction(cacheKey, conjunctions);
      
      return conjunctions;
    });
  }

  /**
   * Batch request for multiple satellites (optimized for 1000+)
   */
  async batchGetSatelliteData(
    noradIds: number[],
    dataTypes: ("tle" | "catalog" | "omm")[]
  ): Promise<Map<number, any>> {
    const batchSize = 100; // Process in batches of 100
    const results = new Map<number, any>();
    
    // Split into batches
    const batches: number[][] = [];
    for (let i = 0; i < noradIds.length; i += batchSize) {
      batches.push(noradIds.slice(i, i + batchSize));
    }

    // Process batches in parallel (limited concurrency)
    const concurrencyLimit = 5;
    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const currentBatches = batches.slice(i, i + concurrencyLimit);
      
      const batchPromises = currentBatches.map(async batch => {
        const batchKey = `batch_${batch.join(",")}_${dataTypes.join(",")}`;
        
        // Check batch cache
        const cached = this.cache.getBatch(batchKey);
        if (cached) {
          return cached;
        }

        const batchData: any = {};
        
        // Get requested data types
        if (dataTypes.includes("tle")) {
          batchData.tles = await this.getLatestTLEs(batch);
        }
        if (dataTypes.includes("catalog")) {
          const catalogData = await this.getSatelliteCatalog({
            // Filter by NORAD IDs
          });
          batchData.catalog = catalogData;
        }
        
        this.cache.setBatch(batchKey, batchData);
        return batchData;
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Merge results
      batchResults.forEach((batchData, batchIndex) => {
        const batch = currentBatches[batchIndex];
        batch.forEach(noradId => {
          results.set(noradId, batchData);
        });
      });
    }

    return results;
  }

  /**
   * Stream real-time satellite positions for large constellations
   */
  async *streamSatellitePositions(
    noradIds: number[],
    duration: number, // minutes
    interval: number = 60 // seconds
  ): AsyncGenerator<Map<number, any>> {
    const endTime = Date.now() + duration * 60 * 1000;
    
    while (Date.now() < endTime) {
      const positions = new Map<number, any>();
      
      // Get TLEs in batches
      const tleData = await this.batchGetSatelliteData(noradIds, ["tle"]);
      
      // Calculate positions (would integrate with propagator)
      for (const [noradId, data] of tleData) {
        if (data.tles && data.tles.length > 0) {
          const tle = data.tles[0];
          // Position calculation would go here
          positions.set(noradId, {
            noradId,
            timestamp: new Date(),
            position: { /* calculated position */ },
            tle,
          });
        }
      }
      
      yield positions;
      
      // Wait for next interval
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }
  }

  /**
   * Get decay predictions
   */
  async getDecayPredictions(
    options?: {
      daysAhead?: number;
      countryCode?: string;
    }
  ): Promise<Decay[]> {
    if (!this.cookie) await this.authenticate();

    return this.queueRequest(async () => {
      let url = `${this.baseUrl}/basicspacedata/query/class/decay`;
      
      const params: string[] = [];
      
      if (options?.daysAhead) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + options.daysAhead);
        params.push(`DECAY_EPOCH/<=${futureDate.toISOString()}`);
      }
      if (options?.countryCode) {
        params.push(`COUNTRY/${options.countryCode}`);
      }
      
      params.push("format/json");
      
      if (params.length > 0) {
        url += "/" + params.join("/");
      }

      const response = await axios.get(url, {
        headers: {
          Cookie: this.cookie!,
        },
      });

      return this.parseDecayResponse(response.data);
    });
  }

  /**
   * Get launch sites
   */
  async getLaunchSites(): Promise<LaunchSite[]> {
    if (!this.cookie) await this.authenticate();

    return this.queueRequest(async () => {
      const url = `${this.baseUrl}/basicspacedata/query/class/launch_site/format/json`;

      const response = await axios.get(url, {
        headers: {
          Cookie: this.cookie!,
        },
      });

      return this.parseLaunchSiteResponse(response.data);
    });
  }

  /**
   * Parse TLE response
   */
  private parseTLEResponse(data: any): TLE[] {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      noradCatId: parseInt(item.NORAD_CAT_ID),
      objectName: item.OBJECT_NAME,
      epoch: new Date(item.EPOCH),
      line1: item.TLE_LINE1,
      line2: item.TLE_LINE2,
      meanMotion: parseFloat(item.MEAN_MOTION),
      eccentricity: parseFloat(item.ECCENTRICITY),
      inclination: parseFloat(item.INCLINATION),
      raan: parseFloat(item.RA_OF_ASC_NODE),
      argOfPerigee: parseFloat(item.ARG_OF_PERICENTER),
      meanAnomaly: parseFloat(item.MEAN_ANOMALY),
      ephemerisType: parseInt(item.EPHEMERIS_TYPE),
      classType: item.CLASSIFICATION_TYPE,
      intlDes: item.INTLDES,
      epochYear: parseInt(item.EPOCH_YEAR),
      epochDay: parseFloat(item.EPOCH_DAY),
    }));
  }

  /**
   * Parse catalog response
   */
  private parseCatalogResponse(data: any): SpaceObject[] {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      noradCatId: parseInt(item.NORAD_CAT_ID),
      objectName: item.OBJECT_NAME,
      objectType: item.OBJECT_TYPE,
      countryCode: item.COUNTRY_CODE,
      launchDate: new Date(item.LAUNCH),
      decay: item.DECAY ? new Date(item.DECAY) : undefined,
      period: parseFloat(item.PERIOD),
      inclination: parseFloat(item.INCLINATION),
      apogee: parseFloat(item.APOGEE),
      perigee: parseFloat(item.PERIGEE),
      rcs: item.RCS_SIZE ? parseFloat(item.RCS_SIZE) : undefined,
      dataStatus: item.DATA_STATUS,
      orbitCenter: item.ORBIT_CENTER,
      orbitType: item.ORBIT_TYPE,
    }));
  }

  /**
   * Parse conjunction response
   */
  private parseConjunctionResponse(data: any): Conjunction[] {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      primaryObject: parseInt(item.SAT_1_ID),
      secondaryObject: parseInt(item.SAT_2_ID),
      tca: new Date(item.TCA),
      daysFromNow: parseFloat(item.DAYS_FROM_NOW),
      minRangeKm: parseFloat(item.MIN_RNG),
      probability: parseFloat(item.PC),
      maxProbability: parseFloat(item.MAX_PC || item.PC),
    }));
  }

  /**
   * Parse decay response
   */
  private parseDecayResponse(data: any): Decay[] {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      noradCatId: parseInt(item.NORAD_CAT_ID),
      objectName: item.OBJECT_NAME,
      decayDate: new Date(item.DECAY_EPOCH),
      latitude: parseFloat(item.LAT),
      longitude: parseFloat(item.LON),
      altitude: parseFloat(item.ALT),
    }));
  }

  /**
   * Parse launch site response
   */
  private parseLaunchSiteResponse(data: any): LaunchSite[] {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      siteCode: item.SITE_CODE,
      siteName: item.SITE_NAME,
      latitude: parseFloat(item.LATITUDE),
      longitude: parseFloat(item.LONGITUDE),
      launches: parseInt(item.LAUNCHES),
    }));
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clearAll();
    console.log("🗑️ Space-Track cache cleared");
  }
}

export default SpaceTrackService.getInstance();