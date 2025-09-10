import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface ComplianceMetrics {
  overallScore: number;
  documentsCompliant: number;
  documentsTotal: number;
  expiringDocuments: number;
  missingDocuments: string[];
  upcomingDeadlines: Array<{
    document: string;
    deadline: string;
    daysRemaining: number;
  }>;
  recommendations: string[];
}

export const AIComplianceDashboard = () => {
  const { address } = useAccount();
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timelinePredict, setTimelinePredict] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadComplianceMetrics();
    }
  }, [address]);

  const loadComplianceMetrics = async () => {
    setIsLoading(true);
    try {
      // Simulate AI analysis
      const response = await fetch("/api/venice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyzeMission",
          data: {
            documents: [{ type: "License", status: "Active", uploadDate: new Date().toISOString() }],
          },
        }),
      });

      const result = await response.json();

      // Mock metrics with AI insights
      setMetrics({
        overallScore: 85,
        documentsCompliant: 7,
        documentsTotal: 10,
        expiringDocuments: 2,
        missingDocuments: ["Environmental Impact Assessment", "Radio Frequency Authorization"],
        upcomingDeadlines: [
          { document: "Launch License", deadline: "2025-03-15", daysRemaining: 45 },
          { document: "Insurance Certificate", deadline: "2025-02-28", daysRemaining: 30 },
        ],
        recommendations: result.analysis ? [result.analysis] : ["Complete all required documentation"],
      });

      // Get timeline prediction
      const timelineResponse = await fetch("/api/venice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "predictTimeline",
          data: { currentProgress: 70 },
        }),
      });

      if (timelineResponse.ok) {
        const timelineData = await timelineResponse.json();
        setTimelinePredict(timelineData.prediction || "Launch readiness: 6-8 weeks");
      }
    } catch (error) {
      console.error("Error loading compliance metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-error";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "badge-success";
    if (score >= 70) return "badge-warning";
    return "badge-error";
  };

  if (!address) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <p className="text-center">Connect your account to view compliance dashboard</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <span className="ml-3">Analyzing compliance status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-4">
      {/* Overall Score Card */}
      <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SparklesIcon className="h-8 w-8 text-primary animate-pulse" />
              <div>
                <h2 className="card-title text-xl">Mission Compliance Score</h2>
                <p className="text-sm opacity-70">AI-powered compliance analysis</p>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(metrics.overallScore)}`}>{metrics.overallScore}%</div>
              <div className={`badge ${getScoreBadge(metrics.overallScore)} mt-2`}>
                {metrics.overallScore >= 90 ? "Excellent" : metrics.overallScore >= 70 ? "Good" : "Needs Attention"}
              </div>
            </div>
          </div>

          {timelinePredict && (
            <div className="alert alert-info mt-4">
              <ClockIcon className="h-5 w-5" />
              <span className="text-sm">AI Prediction: {timelinePredict}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Documents Status */}
        <div className="card bg-base-100 shadow">
          <div className="card-body compact">
            <div className="flex items-center gap-3">
              <DocumentCheckIcon className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs opacity-70">Document Compliance</p>
                <p className="text-lg font-semibold">
                  {metrics.documentsCompliant}/{metrics.documentsTotal}
                </p>
              </div>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={metrics.documentsCompliant}
              max={metrics.documentsTotal}
            ></progress>
          </div>
        </div>

        {/* Expiring Documents */}
        <div className="card bg-base-100 shadow">
          <div className="card-body compact">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon
                className={`h-6 w-6 ${metrics.expiringDocuments > 0 ? "text-warning" : "text-success"}`}
              />
              <div>
                <p className="text-xs opacity-70">Expiring Soon</p>
                <p className="text-lg font-semibold">{metrics.expiringDocuments} documents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Documents */}
        <div className="card bg-base-100 shadow">
          <div className="card-body compact">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon
                className={`h-6 w-6 ${metrics.missingDocuments.length > 0 ? "text-error" : "text-success"}`}
              />
              <div>
                <p className="text-xs opacity-70">Missing Documents</p>
                <p className="text-lg font-semibold">{metrics.missingDocuments.length} required</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {metrics.upcomingDeadlines.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-2">
              {metrics.upcomingDeadlines.map((deadline, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-base-200 rounded">
                  <span className="text-sm font-medium">{deadline.document}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-70">{deadline.deadline}</span>
                    <div className={`badge badge-sm ${deadline.daysRemaining <= 30 ? "badge-warning" : "badge-info"}`}>
                      {deadline.daysRemaining} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Missing Documents Alert */}
      {metrics.missingDocuments.length > 0 && (
        <div className="card bg-warning/10 border border-warning shadow">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning" />
              Required Documents Missing
            </h3>
            <ul className="space-y-1">
              {metrics.missingDocuments.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="text-warning">•</span>
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {metrics.recommendations.length > 0 && (
        <div className="card bg-info/10 border border-info shadow">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-info" />
              AI Recommendations
            </h3>
            <ul className="space-y-2">
              {metrics.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircleIcon className="h-4 w-4 text-info mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button className="btn btn-primary btn-sm" onClick={loadComplianceMetrics} disabled={isLoading}>
          <SparklesIcon className="h-4 w-4" />
          Refresh Analysis
        </button>
      </div>
    </div>
  );
};
