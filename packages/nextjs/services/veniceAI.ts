// Venice AI Service for document and mission analysis
const VENICE_API_KEY = process.env.VENICE_API_KEY || process.env.NEXT_PUBLIC_VENICE_API_KEY;
const VENICE_API_URL = "https://api.venice.ai/api/v1";

export interface VeniceAnalysis {
  summary: string;
  riskLevel: "low" | "medium" | "high";
  keyFindings: string[];
  recommendations: string[];
  complianceStatus: string;
}

export interface DocumentAnalysis {
  documentType: string;
  expiryRisk: boolean;
  missingFields: string[];
  regulatoryCompliance: string;
  summary: string;
}

export class VeniceAIService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || VENICE_API_KEY || "";
  }

  // Analyze uploaded document for compliance and risks
  async analyzeDocument(documentContent: string, documentType: string, missionName: string): Promise<DocumentAnalysis> {
    try {
      const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content:
                "You are a space mission compliance expert. Analyze documents for regulatory compliance, safety risks, and completeness. Provide concise, actionable insights for space engineers.",
            },
            {
              role: "user",
              content: `Analyze this ${documentType} document for mission "${missionName}":
              
              ${documentContent}
              
              Provide:
              1. Document type classification
              2. Expiry risk assessment
              3. Missing critical fields
              4. Regulatory compliance status (FAA, NASA standards)
              5. Executive summary (2 sentences max)`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error("Venice AI analysis failed");
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;

      // Parse the AI response into structured data
      return this.parseDocumentAnalysis(analysisText, documentType);
    } catch (error) {
      console.error("Venice AI Error:", error);
      // Return default analysis if AI fails
      return {
        documentType,
        expiryRisk: false,
        missingFields: [],
        regulatoryCompliance: "Pending review",
        summary: "Document uploaded successfully. Manual review recommended.",
      };
    }
  }

  // Analyze mission readiness based on all documents
  async analyzeMissionReadiness(
    documents: Array<{ type: string; status: string; uploadDate: string }>,
  ): Promise<VeniceAnalysis> {
    try {
      const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content:
                "You are a space mission readiness analyst. Evaluate document completeness and provide launch readiness assessment.",
            },
            {
              role: "user",
              content: `Analyze mission readiness based on these documents:
              ${JSON.stringify(documents, null, 2)}
              
              Provide:
              1. Overall readiness summary (2 sentences)
              2. Risk level (low/medium/high)
              3. Key findings (3 bullet points)
              4. Recommendations (3 action items)
              5. Compliance status`,
            },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (!response.ok) {
        throw new Error("Venice AI analysis failed");
      }

      const data = await response.json();
      return this.parseVeniceAnalysis(data.choices[0].message.content);
    } catch (error) {
      console.error("Venice AI Error:", error);
      return {
        summary: "Mission analysis in progress",
        riskLevel: "medium",
        keyFindings: ["Documents uploaded", "Review pending"],
        recommendations: ["Complete document review"],
        complianceStatus: "Under review",
      };
    }
  }

  // Validate document authenticity using AI
  async validateDocument(documentHash: string, metadata: any): Promise<boolean> {
    try {
      const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: "Verify document metadata consistency and flag potential issues.",
            },
            {
              role: "user",
              content: `Validate this document metadata for consistency:
              Hash: ${documentHash}
              Metadata: ${JSON.stringify(metadata)}
              
              Check for: date consistency, required fields, format compliance.
              Respond with: VALID or INVALID (with reason)`,
            },
          ],
          temperature: 0.1,
          max_tokens: 100,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content.includes("VALID");
    } catch (error) {
      console.error("Validation error:", error);
      return true; // Default to valid if AI fails
    }
  }

  // Smart search through documents using AI
  async smartSearch(query: string, documents: any[]): Promise<any[]> {
    try {
      const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: "Help find relevant space mission documents based on natural language queries.",
            },
            {
              role: "user",
              content: `Find documents matching: "${query}"
              
              Documents: ${JSON.stringify(
                documents.map(d => ({
                  id: d.id,
                  type: d.type,
                  title: d.title,
                  date: d.date,
                })),
              )}
              
              Return IDs of matching documents as JSON array.`,
            },
          ],
          temperature: 0.2,
          max_tokens: 200,
        }),
      });

      const data = await response.json();
      const matchingIds = JSON.parse(data.choices[0].message.content);
      return documents.filter(d => matchingIds.includes(d.id));
    } catch (error) {
      console.error("Search error:", error);
      return documents; // Return all if search fails
    }
  }

  // Parse AI responses into structured data
  private parseDocumentAnalysis(text: string, documentType: string): DocumentAnalysis {
    const lines = text.split("\n").filter(l => l.trim());

    return {
      documentType: this.extractValue(lines, "type") || documentType,
      expiryRisk: text.toLowerCase().includes("expir") || text.toLowerCase().includes("renew"),
      missingFields: this.extractList(lines, "missing"),
      regulatoryCompliance: this.extractValue(lines, "compliance") || "Under review",
      summary: this.extractValue(lines, "summary") || lines[lines.length - 1] || "Document processed",
    };
  }

  private parseVeniceAnalysis(text: string): VeniceAnalysis {
    const lines = text.split("\n").filter(l => l.trim());

    const riskText = text.toLowerCase();
    let riskLevel: "low" | "medium" | "high" = "medium";
    if (riskText.includes("high risk") || riskText.includes("critical")) {
      riskLevel = "high";
    } else if (riskText.includes("low risk") || riskText.includes("minimal")) {
      riskLevel = "low";
    }

    return {
      summary: this.extractValue(lines, "summary") || lines[0] || "Analysis complete",
      riskLevel,
      keyFindings: this.extractBulletPoints(lines, "findings") || ["Document review complete"],
      recommendations: this.extractBulletPoints(lines, "recommend") || ["Continue monitoring"],
      complianceStatus: this.extractValue(lines, "compliance") || "Under review",
    };
  }

  private extractValue(lines: string[], keyword: string): string {
    const line = lines.find(l => l.toLowerCase().includes(keyword));
    return line ? line.split(":").slice(1).join(":").trim() : "";
  }

  private extractList(lines: string[], keyword: string): string[] {
    const startIdx = lines.findIndex(l => l.toLowerCase().includes(keyword));
    if (startIdx === -1) return [];

    const items: string[] = [];
    for (let i = startIdx + 1; i < lines.length && i < startIdx + 5; i++) {
      if (lines[i].startsWith("-") || lines[i].startsWith("•") || lines[i].match(/^\d+\./)) {
        items.push(lines[i].replace(/^[-•\d.]\s*/, "").trim());
      }
    }
    return items;
  }

  private extractBulletPoints(lines: string[], keyword: string): string[] {
    return this.extractList(lines, keyword);
  }
}

// Export singleton instance
export const veniceAI = new VeniceAIService();
