/**
 * STK (Systems Tool Kit) Integration Service
 * AGI STK connectivity for professional mission analysis
 */
import axios from "axios";

export interface STKScenario {
  id: string;
  name: string;
  startTime: Date;
  stopTime: Date;
  epoch: Date;
  animation: {
    startTime: Date;
    currentTime: Date;
    speed: number;
  };
}

export interface STKObject {
  id: string;
  name: string;
  type: "Satellite" | "Facility" | "Sensor" | "Constellation" | "Chain";
  parent?: string;
  properties: Record<string, any>;
}

export interface STKAnalysisResult {
  accessTimes?: AccessInterval[];
  coverage?: CoverageData;
  linkBudget?: LinkBudgetData;
  orbitDetermination?: OrbitData;
}

interface AccessInterval {
  startTime: Date;
  stopTime: Date;
  duration: number;
  maxElevation: number;
  range: number;
}

interface CoverageData {
  percentCovered: number;
  gaps: { start: Date; end: Date; duration: number }[];
  revisitTime: number;
}

interface LinkBudgetData {
  eirp: number;
  pathLoss: number;
  receivedPower: number;
  cn0: number;
  bitErrorRate: number;
  margin: number;
}

interface OrbitData {
  elements: {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    raan: number;
    argOfPerigee: number;
    trueAnomaly: number;
  };
  state: {
    position: [number, number, number];
    velocity: [number, number, number];
  };
}

export class STKService {
  private static instance: STKService;
  private baseUrl: string;
  private connected: boolean = false;
  private scenarios: Map<string, STKScenario> = new Map();
  private objects: Map<string, STKObject> = new Map();

  private constructor() {
    this.baseUrl = process.env.STK_SERVER_URL || "http://localhost:8080/STKWebService";
  }

  static getInstance(): STKService {
    if (!STKService.instance) {
      STKService.instance = new STKService();
    }
    return STKService.instance;
  }

  /**
   * Connect to STK Engine
   */
  async connect(): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/connect`, {
        version: "12.0",
        license: process.env.STK_LICENSE_KEY,
      });

      if (response.data.connected) {
        this.connected = true;
        console.log("✅ Connected to STK Engine");
      }
    } catch (error) {
      console.error("Failed to connect to STK:", error);
      throw new Error("STK connection failed");
    }
  }

  /**
   * Create a new scenario
   */
  async createScenario(name: string, startTime: Date, stopTime: Date): Promise<STKScenario> {
    const scenario: STKScenario = {
      id: `scenario_${Date.now()}`,
      name,
      startTime,
      stopTime,
      epoch: startTime,
      animation: {
        startTime,
        currentTime: startTime,
        speed: 1,
      },
    };

    try {
      const response = await axios.post(`${this.baseUrl}/scenario/create`, {
        name,
        startTime: startTime.toISOString(),
        stopTime: stopTime.toISOString(),
      });

      scenario.id = response.data.scenarioId;
      this.scenarios.set(scenario.id, scenario);
      return scenario;
    } catch (error) {
      console.error("Failed to create STK scenario:", error);
      throw error;
    }
  }

  /**
   * Add satellite to scenario
   */
  async addSatellite(
    scenarioId: string,
    satelliteData: {
      name: string;
      tle?: { line1: string; line2: string };
      elements?: any;
      propagator?: "SGP4" | "HPOP" | "J2" | "J4";
    },
  ): Promise<STKObject> {
    const satellite: STKObject = {
      id: `sat_${Date.now()}`,
      name: satelliteData.name,
      type: "Satellite",
      parent: scenarioId,
      properties: satelliteData,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/satellite/add`, {
        scenarioId,
        ...satelliteData,
      });

      satellite.id = response.data.satelliteId;
      this.objects.set(satellite.id, satellite);
      return satellite;
    } catch (error) {
      console.error("Failed to add satellite to STK:", error);
      throw error;
    }
  }

  /**
   * Add ground facility
   */
  async addFacility(
    scenarioId: string,
    facilityData: {
      name: string;
      latitude: number;
      longitude: number;
      altitude: number;
      minElevation?: number;
    },
  ): Promise<STKObject> {
    const facility: STKObject = {
      id: `fac_${Date.now()}`,
      name: facilityData.name,
      type: "Facility",
      parent: scenarioId,
      properties: facilityData,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/facility/add`, {
        scenarioId,
        ...facilityData,
      });

      facility.id = response.data.facilityId;
      this.objects.set(facility.id, facility);
      return facility;
    } catch (error) {
      console.error("Failed to add facility to STK:", error);
      throw error;
    }
  }

  /**
   * Calculate access between objects
   */
  async calculateAccess(
    fromObjectId: string,
    toObjectId: string,
    options?: {
      lightTimeDelay?: boolean;
      aberration?: boolean;
      minElevation?: number;
    },
  ): Promise<AccessInterval[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/analysis/access`, {
        fromObject: fromObjectId,
        toObject: toObjectId,
        options: options || {},
      });

      return response.data.intervals.map((interval: any) => ({
        startTime: new Date(interval.start),
        stopTime: new Date(interval.stop),
        duration: interval.duration,
        maxElevation: interval.maxElevation,
        range: interval.range,
      }));
    } catch (error) {
      console.error("Failed to calculate access:", error);
      throw error;
    }
  }

  /**
   * Calculate coverage
   */
  async calculateCoverage(
    satelliteIds: string[],
    region: {
      type: "GLOBAL" | "LATITUDE_BAND" | "POLYGON";
      bounds?: any;
    },
    options?: {
      gridResolution?: number;
      timeStep?: number;
    },
  ): Promise<CoverageData> {
    try {
      const response = await axios.post(`${this.baseUrl}/analysis/coverage`, {
        satellites: satelliteIds,
        region,
        options: options || {},
      });

      return {
        percentCovered: response.data.percentCovered,
        gaps: response.data.gaps.map((gap: any) => ({
          start: new Date(gap.start),
          end: new Date(gap.end),
          duration: gap.duration,
        })),
        revisitTime: response.data.averageRevisitTime,
      };
    } catch (error) {
      console.error("Failed to calculate coverage:", error);
      throw error;
    }
  }

  /**
   * Perform link budget analysis
   */
  async calculateLinkBudget(
    transmitterId: string,
    receiverId: string,
    frequency: number,
    options?: {
      transmitPower?: number;
      antennaGain?: number;
      systemLosses?: number;
      dataRate?: number;
      modulation?: string;
    },
  ): Promise<LinkBudgetData> {
    try {
      const response = await axios.post(`${this.baseUrl}/analysis/linkbudget`, {
        transmitter: transmitterId,
        receiver: receiverId,
        frequency,
        options: options || {},
      });

      return response.data;
    } catch (error) {
      console.error("Failed to calculate link budget:", error);
      throw error;
    }
  }

  /**
   * Create constellation
   */
  async createConstellation(
    scenarioId: string,
    config: {
      name: string;
      type: "WALKER" | "CUSTOM" | "FLOWER";
      planes?: number;
      satellitesPerPlane?: number;
      altitude?: number;
      inclination?: number;
      satellites?: string[];
    },
  ): Promise<STKObject> {
    const constellation: STKObject = {
      id: `const_${Date.now()}`,
      name: config.name,
      type: "Constellation",
      parent: scenarioId,
      properties: config,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/constellation/create`, {
        scenarioId,
        ...config,
      });

      constellation.id = response.data.constellationId;
      this.objects.set(constellation.id, constellation);
      return constellation;
    } catch (error) {
      console.error("Failed to create constellation:", error);
      throw error;
    }
  }

  /**
   * Perform trade study
   */
  async performTradeStudy(
    variables: {
      name: string;
      type: "CONTINUOUS" | "DISCRETE";
      min?: number;
      max?: number;
      values?: any[];
    }[],
    objective: {
      type: "MAXIMIZE" | "MINIMIZE";
      metric: string;
    },
    constraints?: {
      metric: string;
      operator: ">" | "<" | "=" | ">=" | "<=";
      value: number;
    }[],
  ): Promise<{
    optimal: Record<string, any>;
    alternatives: Record<string, any>[];
    pareto: Record<string, any>[];
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/analysis/tradestudy`, {
        variables,
        objective,
        constraints: constraints || [],
      });

      return response.data;
    } catch (error) {
      console.error("Failed to perform trade study:", error);
      throw error;
    }
  }

  /**
   * Generate report
   */
  async generateReport(
    scenarioId: string,
    reportType: "ACCESS" | "COVERAGE" | "ORBIT" | "LINK_BUDGET" | "CUSTOM",
    options?: {
      format?: "PDF" | "HTML" | "CSV" | "JSON";
      template?: string;
      objects?: string[];
    },
  ): Promise<{ url: string; data?: any }> {
    try {
      const response = await axios.post(`${this.baseUrl}/report/generate`, {
        scenarioId,
        reportType,
        options: options || {},
      });

      return {
        url: response.data.reportUrl,
        data: response.data.reportData,
      };
    } catch (error) {
      console.error("Failed to generate report:", error);
      throw error;
    }
  }

  /**
   * Export scenario
   */
  async exportScenario(scenarioId: string, format: "VDF" | "CZML" | "KML" | "COLLADA"): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/scenario/export`, {
        scenarioId,
        format,
      });

      return response.data.exportUrl;
    } catch (error) {
      console.error("Failed to export scenario:", error);
      throw error;
    }
  }

  /**
   * Run automation script
   */
  async runAutomation(script: string, language: "MATLAB" | "PYTHON" | "CONNECT"): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/automation/run`, {
        script,
        language,
      });

      return response.data.result;
    } catch (error) {
      console.error("Failed to run automation:", error);
      throw error;
    }
  }

  /**
   * Disconnect from STK
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      try {
        await axios.post(`${this.baseUrl}/disconnect`);
        this.connected = false;
        this.scenarios.clear();
        this.objects.clear();
        console.log("Disconnected from STK");
      } catch (error) {
        console.error("Failed to disconnect from STK:", error);
      }
    }
  }
}

export default STKService.getInstance();
