"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronRight, Code, FileText, Rocket, TestTube, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface GeneratedOutput {
  _id: string;
  userId: string;
  type: "mission_plan" | "icd_driver" | "test_case" | "orbital_analysis";
  prompt: string;
  output: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export default function UserOutputHistory() {
  const { status } = useSession();
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutput, setSelectedOutput] = useState<GeneratedOutput | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchOutputs = async () => {
    if (status !== "authenticated") return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "10",
        skip: (page * 10).toString(),
      });

      if (filter !== "all") {
        params.append("type", filter);
      }

      const response = await fetch(`/api/outputs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOutputs(page === 0 ? data.outputs : [...outputs, ...data.outputs]);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error fetching outputs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutputs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filter, page]);

  const deleteOutput = async (id: string) => {
    if (!confirm("Are you sure you want to delete this output?")) return;

    try {
      const response = await fetch(`/api/outputs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setOutputs(outputs.filter(o => o._id !== id));
        if (selectedOutput?._id === id) {
          setSelectedOutput(null);
        }
      }
    } catch (error) {
      console.error("Error deleting output:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "mission_plan":
        return <Rocket className="w-4 h-4" />;
      case "icd_driver":
        return <Code className="w-4 h-4" />;
      case "test_case":
        return <TestTube className="w-4 h-4" />;
      case "orbital_analysis":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "mission_plan":
        return "Mission Plan";
      case "icd_driver":
        return "ICD Driver";
      case "test_case":
        return "Test Case";
      case "orbital_analysis":
        return "Orbital Analysis";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-8">
        <p className="text-lg mb-4">Please sign in to view your outputs</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Your Generated Outputs</h2>
        <p className="text-sm opacity-70">Access all your AI-generated mission plans, drivers, and test cases</p>
      </div>

      {/* Filter Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${filter === "all" ? "tab-active" : ""}`}
          onClick={() => {
            setFilter("all");
            setPage(0);
          }}
        >
          All
        </button>
        <button
          className={`tab ${filter === "mission_plan" ? "tab-active" : ""}`}
          onClick={() => {
            setFilter("mission_plan");
            setPage(0);
          }}
        >
          Mission Plans
        </button>
        <button
          className={`tab ${filter === "icd_driver" ? "tab-active" : ""}`}
          onClick={() => {
            setFilter("icd_driver");
            setPage(0);
          }}
        >
          ICD Drivers
        </button>
        <button
          className={`tab ${filter === "test_case" ? "tab-active" : ""}`}
          onClick={() => {
            setFilter("test_case");
            setPage(0);
          }}
        >
          Test Cases
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Output List */}
        <div className="lg:col-span-1 space-y-3">
          {loading && page === 0 ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner"></span>
            </div>
          ) : outputs.length === 0 ? (
            <div className="text-center py-8">
              <p className="opacity-70">No outputs found</p>
            </div>
          ) : (
            <>
              {outputs.map(output => (
                <div
                  key={output._id}
                  className={`card bg-base-100 cursor-pointer transition-all hover:shadow-lg ${
                    selectedOutput?._id === output._id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedOutput(output)}
                >
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getIcon(output.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{output.prompt.slice(0, 50)}...</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="badge badge-sm badge-ghost">{getTypeLabel(output.type)}</span>
                            <span className="text-xs opacity-60 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(output.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <button className="btn btn-outline btn-block" onClick={() => setPage(page + 1)} disabled={loading}>
                  {loading ? <span className="loading loading-spinner"></span> : "Load More"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Output Detail */}
        <div className="lg:col-span-2">
          {selectedOutput ? (
            <div className="card bg-base-100">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{getTypeLabel(selectedOutput.type)}</h3>
                    <p className="text-sm opacity-70">Created {formatDate(selectedOutput.createdAt)}</p>
                  </div>
                  <button className="btn btn-sm btn-error btn-outline" onClick={() => deleteOutput(selectedOutput._id)}>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>

                <div className="divider"></div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Prompt</h4>
                  <p className="text-sm bg-base-200 p-3 rounded-lg">{selectedOutput.prompt}</p>
                </div>

                {selectedOutput.metadata && Object.keys(selectedOutput.metadata).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Metadata</h4>
                    <div className="bg-base-200 p-3 rounded-lg">
                      <pre className="text-xs overflow-x-auto">{JSON.stringify(selectedOutput.metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Output</h4>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOutput.output);
                        // Show toast
                        const toast = document.createElement("div");
                        toast.className = "toast toast-top toast-end";
                        toast.innerHTML = `
                          <div class="alert alert-success">
                            <span>Copied to clipboard!</span>
                          </div>
                        `;
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 2000);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="bg-base-200 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{selectedOutput.output}</pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center opacity-50">
                <FileText className="w-16 h-16 mx-auto mb-4" />
                <p>Select an output to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
