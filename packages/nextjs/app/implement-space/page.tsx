"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Package, Rocket, Satellite, Save, Send, Sparkles, Users } from "lucide-react";
import { useSession } from "next-auth/react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const missionSteps = [
    { icon: Rocket, label: "Mission Overview", key: "overview" },
    { icon: Satellite, label: "Payload Design", key: "payload" },
    { icon: Users, label: "Crew Requirements", key: "crew" },
    { icon: MapPin, label: "Trajectory Planning", key: "trajectory" },
    { icon: Package, label: "Resource Allocation", key: "resources" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateMissionElements = async (userPrompt: string) => {
    setIsGenerating(true);

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
      setMessages(prev => [
        ...prev,
        { role: "user", content: userPrompt },
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Error generating mission:", error);
      setMessages(prev => [
        ...prev,
        { role: "user", content: userPrompt },
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
          <p className="text-xl text-purple-200">AI-Driven Mission Planning Dashboard - Prompt Your Way to Space!</p>
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
                        <div className="bg-white/10 border border-purple-500/20 p-4 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                            <span className="text-purple-200">Generating mission plan...</span>
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
      </div>
    </div>
  );
}
