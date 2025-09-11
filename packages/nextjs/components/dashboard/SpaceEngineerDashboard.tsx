"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  Globe,
  HardDrive,
  PlayCircle,
  Rocket,
  Satellite,
  Settings,
  Shield,
  Signal,
  Target,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Types
interface MissionStatus {
  id: string;
  name: string;
  status: "active" | "planned" | "critical" | "completed";
  phase: string;
  nextMilestone: string;
  countdownTarget: Date;
  healthIndicator: "green" | "yellow" | "red";
  progress: number;
}

interface SatelliteData {
  id: string;
  name: string;
  status: "operational" | "degraded" | "offline";
  orbitType: string;
  nextPass: {
    station: string;
    aos: Date;
    los: Date;
  };
  linkBudget: {
    uplink: number;
    downlink: number;
    status: "good" | "marginal" | "poor";
  };
}

interface TaskReminder {
  id: string;
  title: string;
  type: "activity" | "compliance" | "test" | "review";
  dueDate: Date;
  priority: "high" | "medium" | "low";
  assignee?: string;
}

interface SystemHealth {
  component: string;
  status: "healthy" | "warning" | "critical";
  value: number;
  unit: string;
  lastUpdate: Date;
}

interface ActivityFeedItem {
  id: string;
  type: "mission" | "team" | "system" | "integration";
  title: string;
  description: string;
  timestamp: Date;
  severity: "info" | "warning" | "error" | "success";
}

interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

interface OrbitDataPoint {
  time: string;
  altitude: number;
  velocity: number;
  timestamp: number;
}

interface ResourceUsageData {
  name: string;
  value: number;
  color: string;
}

// Mock data generator
const generateMockData = () => {
  const missions: MissionStatus[] = [
    {
      id: "1",
      name: "ARTEMIS-VII Lunar Landing",
      status: "active",
      phase: "Trajectory Correction",
      nextMilestone: "Lunar Orbit Insertion",
      countdownTarget: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      healthIndicator: "green",
      progress: 78,
    },
    {
      id: "2",
      name: "STARLINK-6-15 Deployment",
      status: "critical",
      phase: "Pre-Launch Checks",
      nextMilestone: "Launch Window Open",
      countdownTarget: new Date(Date.now() + 6 * 60 * 60 * 1000),
      healthIndicator: "red",
      progress: 92,
    },
    {
      id: "3",
      name: "ISS Cargo Resupply",
      status: "planned",
      phase: "Final Integration",
      nextMilestone: "Launch Readiness Review",
      countdownTarget: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      healthIndicator: "yellow",
      progress: 45,
    },
  ];

  const satellites: SatelliteData[] = [
    {
      id: "1",
      name: "NOAA-20",
      status: "operational",
      orbitType: "Sun-Synchronous",
      nextPass: {
        station: "Wallops",
        aos: new Date(Date.now() + 45 * 60 * 1000),
        los: new Date(Date.now() + 55 * 60 * 1000),
      },
      linkBudget: { uplink: 8.2, downlink: 12.4, status: "good" },
    },
    {
      id: "2",
      name: "GOES-18",
      status: "operational",
      orbitType: "Geostationary",
      nextPass: {
        station: "White Sands",
        aos: new Date(Date.now() + 2 * 60 * 60 * 1000),
        los: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
      },
      linkBudget: { uplink: 15.6, downlink: 18.2, status: "good" },
    },
  ];

  const tasks: TaskReminder[] = [
    {
      id: "1",
      title: "Complete ITAR compliance audit",
      type: "compliance",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: "high",
      assignee: "J. Smith",
    },
    {
      id: "2",
      title: "Thruster burn test sequence",
      type: "test",
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      priority: "high",
    },
    {
      id: "3",
      title: "Review telemetry data analysis",
      type: "review",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: "medium",
    },
  ];

  const systemHealth: SystemHealth[] = [
    {
      component: "Ground Station Network",
      status: "healthy",
      value: 98.7,
      unit: "%",
      lastUpdate: new Date(),
    },
    {
      component: "API Credits Remaining",
      status: "warning",
      value: 2847,
      unit: "credits",
      lastUpdate: new Date(),
    },
    {
      component: "Data Storage Usage",
      status: "healthy",
      value: 67.3,
      unit: "%",
      lastUpdate: new Date(),
    },
    {
      component: "Processing Queue",
      status: "critical",
      value: 156,
      unit: "jobs",
      lastUpdate: new Date(),
    },
  ];

  const activityFeed: ActivityFeedItem[] = [
    {
      id: "1",
      type: "mission",
      title: "ARTEMIS-VII trajectory update",
      description: "Course correction burn completed successfully",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      severity: "success",
    },
    {
      id: "2",
      type: "system",
      title: "API rate limit warning",
      description: "Approaching daily quota for orbital propagation service",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      severity: "warning",
    },
    {
      id: "3",
      type: "team",
      title: "New team member joined",
      description: "Dr. Elena Rodriguez added to Mission Control team",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      severity: "info",
    },
  ];

  // Generate signal strength data for the last 24 hours
  const signalStrengthData: ChartDataPoint[] = Array.from({ length: 24 }, (_, i) => {
    const time = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
    return {
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: 85 + Math.random() * 15 + Math.sin(i * 0.5) * 5,
      timestamp: time.getTime(),
    };
  });

  // Generate orbital tracking data
  const orbitData: OrbitDataPoint[] = Array.from({ length: 12 }, (_, i) => {
    const time = new Date(Date.now() - (11 - i) * 60 * 60 * 1000);
    return {
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      altitude: 408 + Math.sin(i * 0.8) * 15 + Math.random() * 5,
      velocity: 7.66 + Math.cos(i * 0.6) * 0.1 + Math.random() * 0.05,
      timestamp: time.getTime(),
    };
  });

  // Resource usage data
  const resourceUsage: ResourceUsageData[] = [
    { name: "CPU", value: 67, color: "#3B82F6" },
    { name: "Memory", value: 45, color: "#10B981" },
    { name: "Storage", value: 89, color: "#F59E0B" },
    { name: "Network", value: 34, color: "#EF4444" },
  ];

  return {
    missions,
    satellites,
    tasks,
    systemHealth,
    activityFeed,
    signalStrengthData,
    orbitData,
    resourceUsage,
  };
};

// Utility functions
const formatCountdown = (targetDate: Date): string => {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return "00:00:00";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "green":
    case "healthy":
    case "operational":
    case "good":
      return "text-green-400";
    case "yellow":
    case "warning":
    case "degraded":
    case "marginal":
      return "text-yellow-400";
    case "red":
    case "critical":
    case "offline":
    case "poor":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

const getStatusBgColor = (status: string): string => {
  switch (status) {
    case "green":
    case "healthy":
    case "operational":
    case "good":
      return "bg-green-400/10 border-green-400/20";
    case "yellow":
    case "warning":
    case "degraded":
    case "marginal":
      return "bg-yellow-400/10 border-yellow-400/20";
    case "red":
    case "critical":
    case "offline":
    case "poor":
      return "bg-red-400/10 border-red-400/20";
    default:
      return "bg-gray-400/10 border-gray-400/20";
  }
};

// Component
const SpaceEngineerDashboard: React.FC = () => {
  const [data, setData] = useState(generateMockData());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Update time every second for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate initial loading
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      clearInterval(timer);
      clearTimeout(loadingTimer);
    };
  }, []);

  // Refresh data periodically
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setData(generateMockData());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshTimer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing Space Engineer Dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Connecting to mission control systems</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Space Engineer Dashboard</h1>
            <p className="text-gray-400">Mission Control Center - {currentTime.toLocaleString()}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Systems Nominal</span>
            </div>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Mission Status Overview */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Rocket className="mr-2" size={20} />
              Mission Status Overview
            </h2>
            <button className="text-blue-400 hover:text-blue-300 text-sm">View All</button>
          </div>

          <div className="space-y-4">
            {data.missions.map(mission => (
              <div key={mission.id} className={`p-4 rounded-lg border ${getStatusBgColor(mission.healthIndicator)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(mission.healthIndicator).replace("text-", "bg-")}`}
                    ></div>
                    <h3 className="font-semibold">{mission.name}</h3>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">{mission.phase}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono">{formatCountdown(mission.countdownTarget)}</div>
                    <div className="text-xs text-gray-400">to {mission.nextMilestone}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mission.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{mission.progress}% Complete</div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 hover:bg-gray-600 rounded">
                      <PlayCircle size={16} />
                    </button>
                    <button className="p-1 hover:bg-gray-600 rounded">
                      <Settings size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Monitor */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Activity className="mr-2" size={20} />
            System Health
          </h2>

          <div className="space-y-4">
            {data.systemHealth.map((system, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(system.status).replace("text-", "bg-")}`}
                  ></div>
                  <div>
                    <div className="text-sm font-medium">{system.component}</div>
                    <div className="text-xs text-gray-400">Updated {system.lastUpdate.toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getStatusColor(system.status)}`}>
                    {system.value}
                    {system.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Real-time Satellite Tracking */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Satellite className="mr-2" size={20} />
              Satellite Tracking
            </h2>
            <div className="text-sm text-gray-400">{data.satellites.length} Active</div>
          </div>

          <div className="space-y-4">
            {data.satellites.map(satellite => (
              <div key={satellite.id} className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Signal className={getStatusColor(satellite.status)} size={16} />
                    <div>
                      <div className="font-semibold">{satellite.name}</div>
                      <div className="text-xs text-gray-400">{satellite.orbitType}</div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${getStatusBgColor(satellite.status)}`}>
                    {satellite.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Next Pass:</div>
                    <div>{satellite.nextPass.station}</div>
                    <div className="text-xs">AOS: {formatCountdown(satellite.nextPass.aos)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Link Budget:</div>
                    <div className="flex space-x-2">
                      <span>↑{satellite.linkBudget.uplink}dB</span>
                      <span>↓{satellite.linkBudget.downlink}dB</span>
                    </div>
                    <div className={`text-xs ${getStatusColor(satellite.linkBudget.status)}`}>
                      {satellite.linkBudget.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Tasks & Reminders */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Calendar className="mr-2" size={20} />
              Today&apos;s Tasks
            </h2>
            <button className="text-blue-400 hover:text-blue-300 text-sm">Add Task</button>
          </div>

          <div className="space-y-3">
            {data.tasks.map(task => (
              <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${
                    task.priority === "high"
                      ? "bg-red-400"
                      : task.priority === "medium"
                        ? "bg-yellow-400"
                        : "bg-green-400"
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <Clock size={12} />
                    <span>Due: {task.dueDate.toLocaleDateString()}</span>
                    {task.assignee && <span>• {task.assignee}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {task.type === "compliance" && <Shield size={16} className="text-purple-400" />}
                  {task.type === "test" && <Zap size={16} className="text-orange-400" />}
                  {task.type === "review" && <CheckCircle size={16} className="text-blue-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Signal Strength Chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Signal className="mr-2" size={20} />
            Signal Strength (24h)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.signalStrengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={[70, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F3F4F6",
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} dB`, "Signal Strength"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orbital Parameters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Globe className="mr-2" size={20} />
            Orbital Parameters
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.orbitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="altitude" stroke="#10B981" fontSize={12} domain={[390, 430]} />
                <YAxis yAxisId="velocity" orientation="right" stroke="#F59E0B" fontSize={12} domain={[7.5, 7.8]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F3F4F6",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "altitude" ? `${value.toFixed(1)} km` : `${value.toFixed(2)} km/s`,
                    name === "altitude" ? "Altitude" : "Velocity",
                  ]}
                />
                <Line
                  yAxisId="altitude"
                  type="monotone"
                  dataKey="altitude"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="velocity"
                  type="monotone"
                  dataKey="velocity"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resource Usage Chart */}
      <div className="mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <HardDrive className="mr-2" size={20} />
            System Resource Usage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.resourceUsage}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.resourceUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#F3F4F6",
                    }}
                    formatter={(value: number) => [`${value}%`, "Usage"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {data.resourceUsage.map((resource, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: resource.color }}></div>
                    <span className="font-medium">{resource.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${resource.value}%`,
                          backgroundColor: resource.color,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{resource.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Panels */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Target className="mr-2" size={20} />
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-center">
              <Rocket size={20} className="mx-auto mb-2" />
              <div className="text-sm font-medium">New Mission</div>
            </button>
            <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-center">
              <Globe size={20} className="mx-auto mb-2" />
              <div className="text-sm font-medium">Orbit Analysis</div>
            </button>
            <button className="p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-center">
              <Wifi size={20} className="mx-auto mb-2" />
              <div className="text-sm font-medium">Ground Pass</div>
            </button>
            <button className="p-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-center">
              <Database size={20} className="mx-auto mb-2" />
              <div className="text-sm font-medium">Report Gen</div>
            </button>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Activity Feed
            </h2>
            <button className="text-blue-400 hover:text-blue-300 text-sm">View All</button>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {data.activityFeed.map(item => (
              <div
                key={item.id}
                className="flex items-start space-x-3 p-3 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <div
                  className={`mt-1 w-2 h-2 rounded-full ${
                    item.severity === "success"
                      ? "bg-green-400"
                      : item.severity === "warning"
                        ? "bg-yellow-400"
                        : item.severity === "error"
                          ? "bg-red-400"
                          : "bg-blue-400"
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">{item.type}</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-1">{item.description}</div>
                  <div className="text-xs text-gray-500">{item.timestamp.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceEngineerDashboard;
