"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCode, Globe, MapPin, Package, Rocket, Satellite, Save, Send, Sparkles, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import SpaceVisualization from "~~/components/SpaceVisualization";
import ICDProcessor from "~~/components/ICDProcessor";

// Dynamic import for Cesium component
const Cesium3DViewer = dynamic(() => import("~~/components/Cesium3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-base-200 rounded-lg flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  ),
});

interface MissionElement {
  id: string;
  type: "launch" | "payload" | "crew" | "trajectory" | "communication" | "budget" | "timeline" | "risk";
  title: string;
  description: string;
  details: any;
  status: "pending" | "generating" | "complete";
}

interface Mission {
  id: string;
  name: string;
  description: string;
  elements: MissionElement[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ImplementSpacePage() {
  const { status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rotating messages for typing indicator
  const typingMessages = [
    "Analyzing mission requirements...",
    "Calculating orbital mechanics...",
    "Selecting optimal launch vehicles...",
    "Designing payload specifications...",
    "Planning mission timeline...",
    "Evaluating risk factors...",
    "Optimizing resource allocation...",
  ];

  const [showVisualization, setShowVisualization] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [showOrbitalCalculator, setShowOrbitalCalculator] = useState(false);
  const [showICDProcessor, setShowICDProcessor] = useState(false);
  
  const missionSteps = [
    { icon: Rocket, label: "Mission Overview", key: "overview" },
    { icon: Satellite, label: "Payload Design", key: "payload" },
    { icon: Users, label: "Crew Requirements", key: "crew" },
    { icon: MapPin, label: "Trajectory Planning", key: "trajectory" },
    { icon: Package, label: "Resource Allocation", key: "resources" },
    { icon: Globe, label: "Space Tracking", key: "tracking" },
    { icon: FileCode, label: "ICD Processing", key: "icd" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Rotate typing messages when generating
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setTypingMessageIndex(prev => (prev + 1) % typingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setTypingMessageIndex(0);
    }
  }, [isGenerating, typingMessages.length]);

  const generateMissionElements = async (userPrompt: string) => {
    setIsGenerating(true);

    // Immediately add user message to show activity
    setMessages(prev => [...prev, { role: "user", content: userPrompt }]);

    // Force immediate scroll to show the new message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const response = await fetch("/api/venice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `You are an expert space mission planner. Based on the following mission description, generate a comprehensive mission plan with specific technical details:

Mission Description: ${userPrompt}

Please provide a structured response with the following elements:
1. Mission Overview (objectives, timeline, success criteria)
2. Launch Vehicle Requirements (specific rockets, launch windows)
3. Payload Specifications (mass, dimensions, power requirements)
4. Crew Requirements (if applicable - number, specializations, training)
5. Trajectory and Orbit Details (orbital parameters, delta-v requirements)
6. Communication Infrastructure (ground stations, data rates, frequency bands)
7. Budget Estimation (launch costs, development, operations)
8. Risk Assessment (technical risks, mitigation strategies)
9. Mission Timeline (key milestones, critical path)

Format the response as a detailed technical document with specific numbers and recommendations.`,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if Venice API is not configured
        if (data.error === "Venice AI not configured") {
          throw new Error("Venice AI API key not configured. Please add VENICE_API_KEY to your environment variables.");
        }
        throw new Error(data.error || "Failed to generate mission plan");
      }

      // Parse the AI response and create mission elements
      const newMission: Mission = {
        id: Date.now().toString(),
        name: userPrompt.slice(0, 50) + "...",
        description: userPrompt,
        elements: parseMissionElements(data.response),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setMission(newMission);
      // Only add assistant response since user message was already added
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Error generating mission:", error);
      // Only add error response since user message was already added
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Failed to generate mission plan"}`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const parseMissionElements = (aiResponse: string): MissionElement[] => {
    // This is a simplified parser - you'd want to make this more sophisticated
    const elements: MissionElement[] = [];

    const sections = [
      { type: "launch", title: "Launch Vehicle", regex: /launch vehicle|rocket/i },
      { type: "payload", title: "Payload", regex: /payload|satellite/i },
      { type: "crew", title: "Crew", regex: /crew|astronaut/i },
      { type: "trajectory", title: "Trajectory", regex: /trajectory|orbit/i },
      { type: "communication", title: "Communications", regex: /communication|ground station/i },
      { type: "budget", title: "Budget", regex: /budget|cost/i },
      { type: "timeline", title: "Timeline", regex: /timeline|schedule/i },
      { type: "risk", title: "Risk Assessment", regex: /risk|hazard/i },
    ];

    sections.forEach(section => {
      elements.push({
        id: `${section.type}-${Date.now()}`,
        type: section.type as any,
        title: section.title,
        description: `Generated ${section.title} specifications`,
        details: extractSectionContent(aiResponse, section.regex),
        status: "complete",
      });
    });

    return elements;
  };

  const extractSectionContent = (text: string, regex: RegExp): string => {
    // Simple extraction - finds content near matching keywords
    const lines = text.split("\n");
    const matchingIndex = lines.findIndex(line => regex.test(line));

    if (matchingIndex !== -1) {
      return lines.slice(matchingIndex, Math.min(matchingIndex + 5, lines.length)).join("\n");
    }

    return "Details to be generated...";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    await generateMissionElements(prompt);
    setPrompt("");
  };

  const saveMission = async () => {
    if (!mission || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: mission.name,
          description: mission.description,
          elements: mission.elements,
          aiResponse: messages.find(m => m.role === "assistant")?.content || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save mission");
      }

      // Also save to localStorage as backup
      localStorage.setItem(`mission-${mission.id}`, JSON.stringify(mission));

      // Show success message in a more elegant way
      const successMessage = document.createElement("div");
      successMessage.className =
        "fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse";
      successMessage.textContent = "Mission saved successfully!";
      document.body.appendChild(successMessage);

      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    } catch (error) {
      console.error("Error saving mission:", error);

      // Show error message
      const errorMessage = document.createElement("div");
      errorMessage.className = "fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
      errorMessage.textContent = error instanceof Error ? error.message : "Failed to save mission";
      document.body.appendChild(errorMessage);

      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Rocket className="w-10 h-10 text-purple-400" />
            Implement Space
          </h1>
          <p className="text-xl text-purple-200">
            ConfidentialAI-Driven Mission Planning Dashboard - Prompt Your Way to Space!
          </p>
        </div>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left Panel - Mission Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-bold text-white mb-4">Mission Elements</h2>
              <div className="space-y-3">
                {missionSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === index;
                  const isComplete = mission && index < currentStep;

                  return (
                    <button
                      key={step.key}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-purple-600 text-white"
                          : isComplete
                            ? "bg-green-600/20 text-green-300 hover:bg-green-600/30"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{step.label}</span>
                    </button>
                  );
                })}
              </div>

              {mission && (
                <>
                  <button
                    onClick={saveMission}
                    disabled={isSaving}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Mission Plan
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowVisualization(!showVisualization)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
                  >
                    <Globe className="w-5 h-5" />
                    {showVisualization ? "Hide" : "Show"} Space Tracking
                  </button>
                  <button
                    onClick={() => setShowICDProcessor(!showICDProcessor)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    <FileCode className="w-5 h-5" />
                    {showICDProcessor ? "Hide" : "Show"} ICD Processor
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Center/Right Panel - Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 flex flex-col h-[600px]">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Welcome to Implement Space</h3>
                    <p className="text-purple-200 max-w-md mx-auto">
                      Describe your space mission in detail. Include objectives, payload requirements, destination, and
                      any specific constraints. Our AI will generate a comprehensive mission plan with all critical
                      elements.
                    </p>
                    <div className="mt-6 space-y-2">
                      <p className="text-sm text-purple-300">Example prompts:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() =>
                            setPrompt(
                              "Deploy a constellation of 12 Earth observation satellites in LEO for climate monitoring",
                            )
                          }
                          className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm hover:bg-purple-600/50 transition"
                        >
                          Earth Observation Mission
                        </button>
                        <button
                          onClick={() => setPrompt("Plan a crewed mission to establish a lunar base at the South Pole")}
                          className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm hover:bg-purple-600/50 transition"
                        >
                          Lunar Base Mission
                        </button>
                        <button
                          onClick={() => setPrompt("Launch a deep space probe to study asteroid 16 Psyche")}
                          className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm hover:bg-purple-600/50 transition"
                        >
                          Asteroid Exploration
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            message.role === "user"
                              ? "bg-purple-600 text-white"
                              : "bg-white/10 text-purple-100 border border-purple-500/20"
                          }`}
                        >
                          <pre className="whitespace-pre-wrap font-sans text-sm">{message.content}</pre>
                        </div>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 text-purple-100 border border-purple-500/20 p-4 rounded-2xl max-w-[80%]">
                          <div className="flex items-start gap-3">
                            <div className="flex gap-1 items-center">
                              <span
                                className="animate-bounce inline-block w-2 h-2 bg-purple-400 rounded-full"
                                style={{ animationDelay: "0ms" }}
                              ></span>
                              <span
                                className="animate-bounce inline-block w-2 h-2 bg-purple-400 rounded-full"
                                style={{ animationDelay: "150ms" }}
                              ></span>
                              <span
                                className="animate-bounce inline-block w-2 h-2 bg-purple-400 rounded-full"
                                style={{ animationDelay: "300ms" }}
                              ></span>
                            </div>
                            <div className="flex-1">
                              <p className="text-purple-200 font-medium transition-all duration-500">
                                {typingMessages[typingMessageIndex]}
                              </p>
                              <p className="text-xs text-purple-300 mt-2 opacity-70">
                                Generating comprehensive mission plan with technical specifications
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-6 border-t border-purple-500/20">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Describe your space mission..."
                    className="flex-1 bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 transition"
                    disabled={isGenerating}
                  />
                  <button
                    type="submit"
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Generate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Space Visualization Section */}
        {showVisualization && (
          <div className="mt-8 max-w-7xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Real-Time Space Tracking</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("2d")}
                    className={`px-4 py-2 rounded-lg transition ${
                      viewMode === "2d"
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-purple-200 hover:bg-white/20"
                    }`}
                  >
                    2D View
                  </button>
                  <button
                    onClick={() => setViewMode("3d")}
                    className={`px-4 py-2 rounded-lg transition ${
                      viewMode === "3d"
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-purple-200 hover:bg-white/20"
                    }`}
                  >
                    3D View
                  </button>
                  <button
                    onClick={() => setShowOrbitalCalculator(!showOrbitalCalculator)}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
                  >
                    Orbital Calculator
                  </button>
                </div>
              </div>
              
              {showOrbitalCalculator && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg border border-purple-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Orbital Mechanics Calculator</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-200 text-sm mb-2">TLE Line 1</label>
                      <input
                        type="text"
                        className="w-full bg-white/10 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-purple-300"
                        defaultValue="1 25544U 98067A   24345.52795139  .00012506  00000-0  22495-3 0  9991"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-200 text-sm mb-2">TLE Line 2</label>
                      <input
                        type="text"
                        className="w-full bg-white/10 border border-purple-500/30 rounded px-3 py-2 text-white placeholder-purple-300"
                        defaultValue="2 25544  51.6415 208.4057 0002769  35.9667  61.6291 15.50381554436915"
                      />
                    </div>
                  </div>
                  <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                    Calculate Orbital Elements
                  </button>
                </div>
              )}
              
              {viewMode === "2d" ? (
                <div className="space-visualization-wrapper">
                  <SpaceVisualization />
                </div>
              ) : (
                <div className="cesium-wrapper">
                  <Cesium3DViewer />
                  <div className="mt-4 text-sm text-purple-200 opacity-70">
                    <p>• Use mouse to rotate and zoom the Earth</p>
                    <p>• Click on objects to view details</p>
                    <p>• Timeline controls satellite animation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ICD Processor Section */}
        {showICDProcessor && (
          <div className="mt-8 max-w-7xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
              <ICDProcessor />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
