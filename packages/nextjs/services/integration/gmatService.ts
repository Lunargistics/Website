/**
 * GMAT (General Mission Analysis Tool) Integration Service
 * NASA GMAT connectivity for open-source mission design
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs/promises";
import path from "path";

export interface GMATMission {
  id: string;
  name: string;
  script: string;
  spacecraft: GMATSpacecraft[];
  propagators: GMATpropagator[];
  forceModels: GMATForceModel[];
  optimizers?: GMATOptimizer[];
  outputs: GMATOutput[];
}

export interface GMATSpacecraft {
  name: string;
  epoch: string;
  coordinateSystem: string;
  stateType: "Cartesian" | "Keplerian" | "ModifiedKeplerian";
  state: number[];
  dryMass?: number;
  cd?: number;
  cr?: number;
  dragArea?: number;
  srpArea?: number;
}

export interface GMATpropagator {
  name: string;
  type: "RungeKutta89" | "PrinceDormand78" | "AdamsBashforthMoulton";
  initialStepSize?: number;
  accuracy?: number;
  minStep?: number;
  maxStep?: number;
  forceModel?: string;
}

export interface GMATForceModel {
  name: string;
  centralBody: string;
  gravityField: {
    type: string;
    degree?: number;
    order?: number;
  };
  drag?: {
    atmosphereModel: string;
    f107?: number;
    f107Average?: number;
    magneticIndex?: number;
  };
  srp?: boolean;
  relativistic?: boolean;
  pointMasses?: string[];
}

export interface GMATOptimizer {
  name: string;
  type: "FminconOptimizer" | "VF13AD" | "SNOPT";
  objective: string;
  variables: string[];
  constraints?: string[];
  tolerance?: number;
  maxIterations?: number;
}

export interface GMATOutput {
  type: "ReportFile" | "EphemerisFile" | "OrbitView" | "GroundTrackPlot";
  name: string;
  filename?: string;
  format?: string;
  spacecraft?: string[];
}

export interface GMATResults {
  ephemeris?: EphemerisData[];
  optimization?: OptimizationResult;
  reports?: Record<string, any>;
  plots?: string[];
}

interface EphemerisData {
  time: Date;
  position: [number, number, number];
  velocity: [number, number, number];
  spacecraft: string;
}

interface OptimizationResult {
  objective: number;
  variables: Record<string, number>;
  iterations: number;
  converged: boolean;
}

export class GMATService {
  private static instance: GMATService;
  private gmatPath: string;
  private workDir: string;
  private process: ChildProcess | null = null;
  private missions: Map<string, GMATMission> = new Map();

  private constructor() {
    this.gmatPath = process.env.GMAT_PATH || "/usr/local/GMAT/R2022a/bin/GMAT";
    this.workDir = process.env.GMAT_WORK_DIR || "/tmp/gmat_missions";
  }

  static getInstance(): GMATService {
    if (!GMATService.instance) {
      GMATService.instance = new GMATService();
    }
    return GMATService.instance;
  }

  /**
   * Initialize GMAT workspace
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.workDir, { recursive: true });
      console.log("✅ GMAT workspace initialized");
    } catch (error) {
      console.error("Failed to initialize GMAT workspace:", error);
      throw error;
    }
  }

  /**
   * Create mission from template
   */
  async createMission(
    name: string,
    template: "LEO" | "GEO_TRANSFER" | "LUNAR" | "INTERPLANETARY" | "CUSTOM"
  ): Promise<GMATMission> {
    const mission: GMATMission = {
      id: `gmat_${Date.now()}`,
      name,
      script: this.getTemplateScript(template),
      spacecraft: [],
      propagators: [],
      forceModels: [],
      outputs: [],
    };

    this.missions.set(mission.id, mission);
    return mission;
  }

  /**
   * Add spacecraft to mission
   */
  addSpacecraft(
    missionId: string,
    spacecraft: GMATSpacecraft
  ): void {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error("Mission not found");

    mission.spacecraft.push(spacecraft);
    mission.script = this.updateScript(mission.script, "SPACECRAFT", spacecraft);
  }

  /**
   * Configure force model
   */
  configureForceModel(
    missionId: string,
    forceModel: GMATForceModel
  ): void {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error("Mission not found");

    mission.forceModels.push(forceModel);
    mission.script = this.updateScript(mission.script, "FORCE_MODEL", forceModel);
  }

  /**
   * Add optimizer for trajectory optimization
   */
  addOptimizer(
    missionId: string,
    optimizer: GMATOptimizer
  ): void {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error("Mission not found");

    if (!mission.optimizers) mission.optimizers = [];
    mission.optimizers.push(optimizer);
    mission.script = this.updateScript(mission.script, "OPTIMIZER", optimizer);
  }

  /**
   * Run mission script
   */
  async runMission(missionId: string): Promise<GMATResults> {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error("Mission not found");

    // Write script to file
    const scriptPath = path.join(this.workDir, `${mission.name}.script`);
    await fs.writeFile(scriptPath, mission.script);

    // Run GMAT
    return new Promise((resolve, reject) => {
      const results: GMATResults = {
        ephemeris: [],
        reports: {},
        plots: [],
      };

      this.process = spawn(this.gmatPath, [
        "--run",
        scriptPath,
        "--exit"
      ], {
        cwd: this.workDir,
      });

      this.process.stdout?.on("data", (data) => {
        console.log(`GMAT: ${data}`);
      });

      this.process.stderr?.on("data", (data) => {
        console.error(`GMAT Error: ${data}`);
      });

      this.process.on("close", async (code) => {
        if (code === 0) {
          // Parse output files
          results.ephemeris = await this.parseEphemeris(mission);
          results.reports = await this.parseReports(mission);
          results.plots = await this.findPlots(mission);
          
          if (mission.optimizers?.length) {
            results.optimization = await this.parseOptimizationResults(mission);
          }

          resolve(results);
        } else {
          reject(new Error(`GMAT exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Perform trajectory optimization
   */
  async optimizeTrajectory(
    spacecraft: GMATSpacecraft,
    objective: {
      type: "MIN_FUEL" | "MIN_TIME" | "MAX_PAYLOAD";
      target?: { position?: number[]; orbit?: any };
    },
    constraints?: {
      maxDeltaV?: number;
      maxTime?: number;
      minAltitude?: number;
    }
  ): Promise<OptimizationResult> {
    // Create optimization mission
    const mission = await this.createMission("optimization", "CUSTOM");
    
    // Add spacecraft
    this.addSpacecraft(mission.id, spacecraft);

    // Configure optimizer
    const optimizer: GMATOptimizer = {
      name: "TrajectoryOptimizer",
      type: "FminconOptimizer",
      objective: this.formatObjective(objective),
      variables: ["BurnDuration", "BurnDirection"],
      constraints: this.formatConstraints(constraints),
      tolerance: 1e-6,
      maxIterations: 200,
    };
    this.addOptimizer(mission.id, optimizer);

    // Run optimization
    const results = await this.runMission(mission.id);
    
    if (!results.optimization) {
      throw new Error("Optimization failed");
    }

    return results.optimization;
  }

  /**
   * Calculate launch window
   */
  async calculateLaunchWindow(
    launchSite: { latitude: number; longitude: number },
    targetOrbit: any,
    searchWindow: { start: Date; end: Date },
    options?: {
      inclination?: number;
      launchAzimuthLimits?: [number, number];
    }
  ): Promise<{ windows: Array<{ time: Date; azimuth: number; deltaV: number }> }> {
    const script = this.generateLaunchWindowScript(
      launchSite,
      targetOrbit,
      searchWindow,
      options
    );

    const mission = await this.createMission("launch_window", "CUSTOM");
    mission.script = script;

    const results = await this.runMission(mission.id);
    
    // Parse launch window results
    const windows = await this.parseLaunchWindows(results.reports);
    
    return { windows };
  }

  /**
   * Perform Monte Carlo analysis
   */
  async monteCarloAnalysis(
    missionId: string,
    variables: {
      name: string;
      distribution: "NORMAL" | "UNIFORM" | "TRIANGULAR";
      parameters: number[];
    }[],
    runs: number
  ): Promise<{
    statistics: Record<string, { mean: number; std: number; min: number; max: number }>;
    samples: Array<Record<string, any>>;
  }> {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error("Mission not found");

    // Generate Monte Carlo script
    const mcScript = this.generateMonteCarloScript(mission, variables, runs);
    
    // Create temporary mission for MC analysis
    const mcMission = await this.createMission(`${mission.name}_MC`, "CUSTOM");
    mcMission.script = mcScript;

    // Run Monte Carlo
    const results = await this.runMission(mcMission.id);
    
    // Parse statistics
    const statistics = await this.parseMonteCarloResults(results.reports);
    
    return statistics;
  }

  /**
   * Generate template script
   */
  private getTemplateScript(template: string): string {
    const templates: Record<string, string> = {
      LEO: `
%----------------------------------------
%---------- Spacecraft
%----------------------------------------

Create Spacecraft DefaultSC;
GMAT DefaultSC.DateFormat = UTCGregorian;
GMAT DefaultSC.Epoch = '01 Jan 2024 12:00:00.000';
GMAT DefaultSC.CoordinateSystem = EarthMJ2000Eq;
GMAT DefaultSC.DisplayStateType = Keplerian;
GMAT DefaultSC.SMA = 6878.14;
GMAT DefaultSC.ECC = 0.001;
GMAT DefaultSC.INC = 51.6;
GMAT DefaultSC.RAAN = 0;
GMAT DefaultSC.AOP = 0;
GMAT DefaultSC.TA = 0;

%----------------------------------------
%---------- ForceModels
%----------------------------------------

Create ForceModel DefaultProp_ForceModel;
GMAT DefaultProp_ForceModel.CentralBody = Earth;
GMAT DefaultProp_ForceModel.PrimaryBodies = {Earth};
GMAT DefaultProp_ForceModel.GravityField.Earth.Degree = 10;
GMAT DefaultProp_ForceModel.GravityField.Earth.Order = 10;
GMAT DefaultProp_ForceModel.Drag.AtmosphereModel = MSISE90;
GMAT DefaultProp_ForceModel.Drag.F107 = 150;
GMAT DefaultProp_ForceModel.Drag.F107A = 150;

%----------------------------------------
%---------- Propagators
%----------------------------------------

Create Propagator DefaultProp;
GMAT DefaultProp.FM = DefaultProp_ForceModel;
GMAT DefaultProp.Type = RungeKutta89;

%----------------------------------------
%---------- Mission Sequence
%----------------------------------------

BeginMissionSequence;
Propagate DefaultProp(DefaultSC) {DefaultSC.ElapsedSecs = 86400};
      `,
      GEO_TRANSFER: `
% GTO Mission Template
Create Spacecraft GTO_SC;
GMAT GTO_SC.SMA = 24371.1;
GMAT GTO_SC.ECC = 0.7257;
GMAT GTO_SC.INC = 7;
      `,
      LUNAR: `
% Lunar Mission Template
Create Spacecraft Lunar_SC;
Create ForceModel LunarProp_ForceModel;
GMAT LunarProp_ForceModel.PointMasses = {Earth, Luna, Sun};
      `,
      CUSTOM: "",
    };

    return templates[template] || templates.CUSTOM;
  }

  /**
   * Update script with new components
   */
  private updateScript(script: string, type: string, data: any): string {
    // Script generation logic based on type
    switch (type) {
      case "SPACECRAFT":
        return script + this.generateSpacecraftScript(data);
      case "FORCE_MODEL":
        return script + this.generateForceModelScript(data);
      case "OPTIMIZER":
        return script + this.generateOptimizerScript(data);
      default:
        return script;
    }
  }

  /**
   * Generate spacecraft script
   */
  private generateSpacecraftScript(spacecraft: GMATSpacecraft): string {
    return `
Create Spacecraft ${spacecraft.name};
GMAT ${spacecraft.name}.DateFormat = UTCGregorian;
GMAT ${spacecraft.name}.Epoch = '${spacecraft.epoch}';
GMAT ${spacecraft.name}.CoordinateSystem = ${spacecraft.coordinateSystem};
GMAT ${spacecraft.name}.DisplayStateType = ${spacecraft.stateType};
${spacecraft.state.map((val, idx) => {
  const params = ["SMA", "ECC", "INC", "RAAN", "AOP", "TA"];
  return `GMAT ${spacecraft.name}.${params[idx]} = ${val};`;
}).join("\n")}
    `;
  }

  /**
   * Generate force model script
   */
  private generateForceModelScript(forceModel: GMATForceModel): string {
    return `
Create ForceModel ${forceModel.name};
GMAT ${forceModel.name}.CentralBody = ${forceModel.centralBody};
GMAT ${forceModel.name}.GravityField.${forceModel.centralBody}.Degree = ${forceModel.gravityField.degree || 4};
GMAT ${forceModel.name}.GravityField.${forceModel.centralBody}.Order = ${forceModel.gravityField.order || 4};
${forceModel.drag ? `
GMAT ${forceModel.name}.Drag.AtmosphereModel = ${forceModel.drag.atmosphereModel};
GMAT ${forceModel.name}.Drag.F107 = ${forceModel.drag.f107 || 150};
GMAT ${forceModel.name}.Drag.F107A = ${forceModel.drag.f107Average || 150};
` : ""}
${forceModel.srp ? `GMAT ${forceModel.name}.SRP = On;` : ""}
${forceModel.pointMasses ? `GMAT ${forceModel.name}.PointMasses = {${forceModel.pointMasses.join(", ")}};` : ""}
    `;
  }

  /**
   * Generate optimizer script
   */
  private generateOptimizerScript(optimizer: GMATOptimizer): string {
    return `
Create ${optimizer.type} ${optimizer.name};
GMAT ${optimizer.name}.ShowProgress = true;
GMAT ${optimizer.name}.MaximumIterations = ${optimizer.maxIterations || 200};
GMAT ${optimizer.name}.Tolerance = ${optimizer.tolerance || 1e-6};
    `;
  }

  /**
   * Parse ephemeris output
   */
  private async parseEphemeris(mission: GMATMission): Promise<EphemerisData[]> {
    const ephemerisData: EphemerisData[] = [];
    
    for (const output of mission.outputs) {
      if (output.type === "EphemerisFile" && output.filename) {
        const filePath = path.join(this.workDir, output.filename);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          // Parse ephemeris file format (simplified)
          const lines = content.split("\n");
          for (const line of lines) {
            if (line.trim() && !line.startsWith("#")) {
              const parts = line.split(/\s+/);
              if (parts.length >= 7) {
                ephemerisData.push({
                  time: new Date(parseFloat(parts[0]) * 1000),
                  position: [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                  ],
                  velocity: [
                    parseFloat(parts[4]),
                    parseFloat(parts[5]),
                    parseFloat(parts[6]),
                  ],
                  spacecraft: output.spacecraft?.[0] || "unknown",
                });
              }
            }
          }
        } catch (error) {
          console.error(`Failed to parse ephemeris file ${output.filename}:`, error);
        }
      }
    }
    
    return ephemerisData;
  }

  /**
   * Parse report files
   */
  private async parseReports(mission: GMATMission): Promise<Record<string, any>> {
    const reports: Record<string, any> = {};
    
    for (const output of mission.outputs) {
      if (output.type === "ReportFile" && output.filename) {
        const filePath = path.join(this.workDir, output.filename);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          reports[output.name] = this.parseReportContent(content);
        } catch (error) {
          console.error(`Failed to parse report ${output.filename}:`, error);
        }
      }
    }
    
    return reports;
  }

  /**
   * Parse report content
   */
  private parseReportContent(content: string): any {
    // Simple CSV/TSV parsing
    const lines = content.split("\n");
    const headers = lines[0]?.split(/[,\t]/) || [];
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(/[,\t]/);
        const row: Record<string, any> = {};
        headers.forEach((header, idx) => {
          row[header.trim()] = isNaN(Number(values[idx]))
            ? values[idx]
            : Number(values[idx]);
        });
        data.push(row);
      }
    }
    
    return data;
  }

  /**
   * Find generated plots
   */
  private async findPlots(mission: GMATMission): Promise<string[]> {
    const plots: string[] = [];
    
    for (const output of mission.outputs) {
      if (output.type === "OrbitView" || output.type === "GroundTrackPlot") {
        // GMAT typically saves plots as images
        const patterns = ["*.png", "*.jpg", "*.eps"];
        for (const pattern of patterns) {
          const plotPath = path.join(this.workDir, output.name + pattern.slice(1));
          try {
            await fs.access(plotPath);
            plots.push(plotPath);
          } catch {
            // File doesn't exist
          }
        }
      }
    }
    
    return plots;
  }

  /**
   * Parse optimization results
   */
  private async parseOptimizationResults(mission: GMATMission): Promise<OptimizationResult> {
    // Parse optimization output (simplified)
    return {
      objective: 0,
      variables: {},
      iterations: 0,
      converged: true,
    };
  }

  /**
   * Format objective function
   */
  private formatObjective(objective: any): string {
    switch (objective.type) {
      case "MIN_FUEL":
        return "Minimize FuelMass";
      case "MIN_TIME":
        return "Minimize ElapsedDays";
      case "MAX_PAYLOAD":
        return "Maximize PayloadMass";
      default:
        return "Minimize Cost";
    }
  }

  /**
   * Format constraints
   */
  private formatConstraints(constraints?: any): string[] {
    const constraintList: string[] = [];
    
    if (constraints?.maxDeltaV) {
      constraintList.push(`DeltaV <= ${constraints.maxDeltaV}`);
    }
    if (constraints?.maxTime) {
      constraintList.push(`MissionDuration <= ${constraints.maxTime}`);
    }
    if (constraints?.minAltitude) {
      constraintList.push(`Altitude >= ${constraints.minAltitude}`);
    }
    
    return constraintList;
  }

  /**
   * Generate launch window script
   */
  private generateLaunchWindowScript(
    launchSite: any,
    targetOrbit: any,
    searchWindow: any,
    options?: any
  ): string {
    // Generate GMAT script for launch window analysis
    return `
% Launch Window Analysis
Create GroundStation LaunchSite;
GMAT LaunchSite.Latitude = ${launchSite.latitude};
GMAT LaunchSite.Longitude = ${launchSite.longitude};

% Target orbit definition
% ... (implementation details)

% Search window
% ... (implementation details)

BeginMissionSequence;
% Launch window search algorithm
    `;
  }

  /**
   * Parse launch windows
   */
  private async parseLaunchWindows(reports: Record<string, any>): Promise<any[]> {
    // Parse launch window results from reports
    return [];
  }

  /**
   * Generate Monte Carlo script
   */
  private generateMonteCarloScript(
    mission: GMATMission,
    variables: any[],
    runs: number
  ): string {
    // Generate GMAT script for Monte Carlo analysis
    return `
% Monte Carlo Analysis
% Number of runs: ${runs}
% Variables: ${variables.map(v => v.name).join(", ")}

${mission.script}

% Monte Carlo setup
% ... (implementation details)
    `;
  }

  /**
   * Parse Monte Carlo results
   */
  private async parseMonteCarloResults(reports: Record<string, any>): Promise<any> {
    // Parse Monte Carlo statistics
    return {
      statistics: {},
      samples: [],
    };
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    
    // Clean work directory
    try {
      const files = await fs.readdir(this.workDir);
      for (const file of files) {
        await fs.unlink(path.join(this.workDir, file));
      }
    } catch (error) {
      console.error("Failed to clean GMAT workspace:", error);
    }
  }
}

export default GMATService.getInstance();