import { useCallback, useEffect, useState } from "react";
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { VeniceAnalysis, veniceAI } from "~~/services/veniceAI";

interface AIAnalysisPanelProps {
  documents?: any[];
  missionName?: string;
  onAnalysisComplete?: (analysis: VeniceAnalysis) => void;
}

export const AIAnalysisPanel = ({ documents = [], missionName, onAnalysisComplete }: AIAnalysisPanelProps) => {
  // Suppress unused variable warning
  void missionName;
  const [analysis, setAnalysis] = useState<VeniceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (documents.length > 0) {
      analyzeDocuments();
    }
  }, [documents, analyzeDocuments]);

  const analyzeDocuments = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const result = await veniceAI.analyzeMissionReadiness(
        documents.map(doc => ({
          type: doc.documentType || "Unknown",
          status: doc.active ? "Active" : "Inactive",
          uploadDate: doc.timestamp ? new Date(doc.timestamp).toISOString() : "Unknown",
        })),
      );
      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [documents, onAnalysisComplete]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-success";
      case "medium":
        return "text-warning";
      case "high":
        return "text-error";
      default:
        return "text-base-content";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <ShieldCheckIcon className="h-5 w-5" />;
      case "medium":
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case "high":
        return <ExclamationTriangleIcon className="h-5 w-5 text-error" />;
      default:
        return <ChartBarIcon className="h-5 w-5" />;
    }
  };

  if (!analysis && !isAnalyzing) {
    return null;
  }

  return (
    <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl w-full mb-4">
      <div className="card-body p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
            <h3 className="card-title text-base sm:text-lg">AI Mission Analysis</h3>
          </div>
          <button className="btn btn-ghost btn-xs sm:btn-sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Minimize" : "Expand"}
          </button>
        </div>

        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <span className="ml-3 text-sm">Analyzing mission readiness...</span>
          </div>
        ) : (
          analysis && (
            <>
              {/* Summary Section */}
              <div className="bg-base-100/50 rounded-lg p-3 mb-3">
                <p className="text-xs sm:text-sm">{analysis.summary}</p>
              </div>

              {/* Risk Level Badge */}
              <div className="flex items-center gap-2 mb-3">
                {getRiskIcon(analysis.riskLevel)}
                <span className={`badge badge-lg ${getRiskColor(analysis.riskLevel)}`}>
                  Risk Level: {analysis.riskLevel.toUpperCase()}
                </span>
                <span className="text-xs opacity-70">Compliance: {analysis.complianceStatus}</span>
              </div>

              {isExpanded && (
                <>
                  {/* Key Findings */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ChartBarIcon className="h-4 w-4 text-info" />
                      <h4 className="font-semibold text-sm">Key Findings</h4>
                    </div>
                    <ul className="space-y-1">
                      {analysis.keyFindings.map((finding, idx) => (
                        <li key={idx} className="text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-info mt-1">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <LightBulbIcon className="h-4 w-4 text-warning" />
                      <h4 className="font-semibold text-sm">Recommendations</h4>
                    </div>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-warning mt-1">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Refresh Analysis Button */}
              <div className="card-actions justify-end mt-3">
                <button className="btn btn-primary btn-xs sm:btn-sm" onClick={analyzeDocuments} disabled={isAnalyzing}>
                  <SparklesIcon className="h-4 w-4" />
                  Refresh Analysis
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};
