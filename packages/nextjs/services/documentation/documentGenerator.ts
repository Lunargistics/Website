/**
 * Mission Documentation Generator Service
 * Generates PDR, CDR, compliance matrices, and other mission documents
 */
import { EquipmentData, MissionData, OrbitData } from "../ipfs/pinataService";
import { GroundStation } from "../orbit/orbitService";

export interface DocumentMetadata {
  title: string;
  type: "PDR" | "CDR" | "FRR" | "ORR" | "Compliance" | "Test" | "Requirements";
  version: string;
  date: string;
  authors: string[];
  reviewers: string[];
  approvers: string[];
  status: "Draft" | "Under Review" | "Approved" | "Released";
}

export interface RequirementsMatrix {
  id: string;
  requirement: string;
  source: string;
  verification: "Analysis" | "Test" | "Inspection" | "Demonstration";
  status: "Open" | "Verified" | "Waived";
  evidence: string;
  notes: string;
}

export interface ComplianceMatrix {
  standard: string;
  clause: string;
  requirement: string;
  applicable: boolean;
  compliance: "Compliant" | "Non-Compliant" | "Partial" | "N/A";
  justification: string;
  evidence: string;
}

export interface TestPlan {
  testId: string;
  testName: string;
  objective: string;
  procedure: string[];
  expectedResults: string;
  actualResults?: string;
  status: "Planned" | "In Progress" | "Complete" | "Failed";
  datePerformed?: string;
  performedBy?: string;
}

class DocumentGeneratorService {
  /**
   * Generate Preliminary Design Review (PDR) document
   */
  generatePDR(mission: MissionData, orbit: OrbitData, equipment: EquipmentData[], metadata: DocumentMetadata): string {
    let doc = `# ${metadata.title}\n\n`;
    doc += `**Document Type:** Preliminary Design Review (PDR)\n`;
    doc += `**Version:** ${metadata.version}\n`;
    doc += `**Date:** ${metadata.date}\n`;
    doc += `**Status:** ${metadata.status}\n\n`;

    // Executive Summary
    doc += `## Executive Summary\n\n`;
    doc += `The ${mission.name} mission is a ${mission.type} mission designed to ${mission.description}.\n\n`;

    // Mission Objectives
    doc += `## 1. Mission Objectives\n\n`;
    mission.objectives.forEach((obj, i) => {
      doc += `1.${i + 1}. ${obj}\n`;
    });
    doc += "\n";

    // System Architecture
    doc += `## 2. System Architecture\n\n`;
    doc += `### 2.1 Space Segment\n\n`;

    // Equipment breakdown
    const categories = new Map<string, EquipmentData[]>();
    equipment.forEach(eq => {
      if (!categories.has(eq.category)) {
        categories.set(eq.category, []);
      }
      categories.get(eq.category)!.push(eq);
    });

    categories.forEach((items, category) => {
      doc += `#### ${category}\n\n`;
      items.forEach(item => {
        doc += `- **${item.name}** (${item.manufacturer})\n`;
        doc += `  - Mass: ${item.specifications.mass} kg\n`;
        doc += `  - Power: ${item.specifications.power} W\n`;
        doc += `  - TRL: ${item.specifications.trl}\n`;
      });
      doc += "\n";
    });

    // Orbit Design
    doc += `### 2.2 Orbit Design\n\n`;
    if (orbit.oem) {
      doc += `- **Orbit Type:** ${this.classifyOrbit(orbit)}\n`;
      doc += `- **Reference Frame:** ${orbit.oem.refFrame}\n`;
      doc += `- **Time System:** ${orbit.oem.timeSystem}\n`;
    } else if (orbit.tle) {
      doc += `- **TLE Line 1:** ${orbit.tle.line1}\n`;
      doc += `- **TLE Line 2:** ${orbit.tle.line2}\n`;
    }
    doc += "\n";

    // Mission Phases
    doc += `## 3. Mission Phases\n\n`;
    mission.phases?.forEach((phase, i) => {
      doc += `### 3.${i + 1} ${phase.name}\n`;
      doc += `- **Start:** ${phase.startDate}\n`;
      doc += `- **End:** ${phase.endDate}\n`;
      doc += `- **Status:** ${phase.status}\n\n`;
    });

    // Risk Assessment
    doc += `## 4. Risk Assessment\n\n`;
    doc += `### 4.1 Technical Risks\n`;
    doc += `- TBD\n\n`;
    doc += `### 4.2 Programmatic Risks\n`;
    doc += `- TBD\n\n`;
    doc += `### 4.3 Cost Risks\n`;
    doc += `- TBD\n\n`;

    // Requirements Verification
    doc += `## 5. Requirements Verification\n\n`;
    if (mission.requirements) {
      doc += `| ID | Requirement | Verified | Evidence |\n`;
      doc += `|----|-------------|----------|----------|\n`;
      mission.requirements.forEach(req => {
        doc += `| ${req.id} | ${req.description} | ${req.verified ? "Yes" : "No"} | TBD |\n`;
      });
    }
    doc += "\n";

    // Appendices
    doc += `## Appendices\n\n`;
    doc += `### A. Acronyms and Abbreviations\n`;
    doc += `- PDR: Preliminary Design Review\n`;
    doc += `- TRL: Technology Readiness Level\n`;
    doc += `- TLE: Two-Line Element\n`;
    doc += `- OEM: Orbit Ephemeris Message\n\n`;

    doc += `### B. References\n`;
    doc += `- ECSS-E-ST-10C: Space engineering - System engineering general requirements\n`;
    doc += `- ECSS-M-ST-10C: Space project management - Project planning and implementation\n`;

    return doc;
  }

  /**
   * Generate Critical Design Review (CDR) document
   */
  generateCDR(
    mission: MissionData,
    orbit: OrbitData,
    equipment: EquipmentData[],
    testPlans: TestPlan[],
    metadata: DocumentMetadata,
  ): string {
    let doc = `# ${metadata.title}\n\n`;
    doc += `**Document Type:** Critical Design Review (CDR)\n`;
    doc += `**Version:** ${metadata.version}\n`;
    doc += `**Date:** ${metadata.date}\n`;
    doc += `**Status:** ${metadata.status}\n\n`;

    // Executive Summary
    doc += `## Executive Summary\n\n`;
    doc += `This document presents the critical design of the ${mission.name} mission, `;
    doc += `demonstrating design maturity and readiness to proceed to manufacturing and integration.\n\n`;

    // Design Overview
    doc += `## 1. Design Overview\n\n`;
    doc += `### 1.1 Mission Architecture\n`;
    doc += `The ${mission.name} mission architecture consists of:\n`;
    doc += `- Space Segment: ${equipment.length} major components\n`;
    doc += `- Ground Segment: ${mission.groundStations?.length || 0} ground stations\n\n`;

    // Detailed Design
    doc += `## 2. Detailed Design\n\n`;

    // Mass Budget
    doc += `### 2.1 Mass Budget\n\n`;
    doc += `| Component | Mass (kg) | Margin (%) |\n`;
    doc += `|-----------|-----------|------------|\n`;
    let totalMass = 0;
    equipment.forEach(eq => {
      const mass = eq.specifications.mass;
      totalMass += mass;
      doc += `| ${eq.name} | ${mass} | 10% |\n`;
    });
    doc += `| **Total** | **${totalMass}** | **10%** |\n\n`;

    // Power Budget
    doc += `### 2.2 Power Budget\n\n`;
    doc += `| Component | Power (W) | Duty Cycle | Avg Power (W) |\n`;
    doc += `|-----------|-----------|------------|---------------|\n`;
    let totalPower = 0;
    equipment.forEach(eq => {
      const power = eq.specifications.power;
      totalPower += power;
      doc += `| ${eq.name} | ${power} | 100% | ${power} |\n`;
    });
    doc += `| **Total** | **${totalPower}** | - | **${totalPower}** |\n\n`;

    // Interface Control
    doc += `### 2.3 Interface Control\n\n`;
    doc += `Key interfaces have been defined and documented:\n`;
    equipment.forEach(eq => {
      if (eq.specifications.interfaces && eq.specifications.interfaces.length > 0) {
        doc += `- **${eq.name}**: ${eq.specifications.interfaces.join(", ")}\n`;
      }
    });
    doc += "\n";

    // Test Planning
    doc += `## 3. Test Planning\n\n`;
    doc += `### 3.1 Test Campaign Overview\n\n`;
    doc += `| Test ID | Test Name | Objective | Status |\n`;
    doc += `|---------|-----------|-----------|--------|\n`;
    testPlans.forEach(test => {
      doc += `| ${test.testId} | ${test.testName} | ${test.objective} | ${test.status} |\n`;
    });
    doc += "\n";

    // Verification Matrix
    doc += `## 4. Verification Matrix\n\n`;
    doc += `| Requirement | Verification Method | Status |\n`;
    doc += `|-------------|-------------------|--------|\n`;
    mission.requirements?.forEach(req => {
      doc += `| ${req.description} | Analysis/Test | ${req.verified ? "Verified" : "Open"} |\n`;
    });
    doc += "\n";

    // Manufacturing and Integration
    doc += `## 5. Manufacturing and Integration\n\n`;
    doc += `### 5.1 Manufacturing Flow\n`;
    doc += `1. Component procurement\n`;
    doc += `2. Sub-assembly integration\n`;
    doc += `3. System integration\n`;
    doc += `4. Environmental testing\n`;
    doc += `5. Final acceptance\n\n`;

    // Risk Update
    doc += `## 6. Risk Update\n\n`;
    doc += `All PDR risks have been reviewed and updated:\n`;
    doc += `- Technical risks: Mitigated through design validation\n`;
    doc += `- Schedule risks: Updated based on current progress\n`;
    doc += `- Cost risks: Refined based on detailed design\n\n`;

    // Conclusions
    doc += `## 7. Conclusions and Recommendations\n\n`;
    doc += `The ${mission.name} design has reached sufficient maturity to proceed to the manufacturing phase. `;
    doc += `All critical design elements have been validated through analysis and preliminary testing.\n\n`;

    doc += `**Recommendation:** Approve transition to Phase D (Manufacturing and Integration).\n`;

    return doc;
  }

  /**
   * Generate Requirements Compliance Matrix
   */
  generateComplianceMatrix(mission: MissionData, standards: string[], complianceData: ComplianceMatrix[]): string {
    let doc = `# Requirements Compliance Matrix\n\n`;
    doc += `**Mission:** ${mission.name}\n`;
    doc += `**Date:** ${new Date().toISOString()}\n\n`;

    // Standards Overview
    doc += `## Applicable Standards\n\n`;
    standards.forEach(std => {
      doc += `- ${std}\n`;
    });
    doc += "\n";

    // Compliance Matrix
    doc += `## Compliance Matrix\n\n`;
    doc += `| Standard | Clause | Requirement | Applicable | Compliance | Justification | Evidence |\n`;
    doc += `|----------|--------|-------------|------------|------------|---------------|----------|\n`;

    complianceData.forEach(item => {
      doc += `| ${item.standard} | ${item.clause} | ${item.requirement} | `;
      doc += `${item.applicable ? "Yes" : "No"} | ${item.compliance} | `;
      doc += `${item.justification} | ${item.evidence} |\n`;
    });
    doc += "\n";

    // Summary Statistics
    doc += `## Compliance Summary\n\n`;
    const compliant = complianceData.filter(i => i.compliance === "Compliant").length;
    const partial = complianceData.filter(i => i.compliance === "Partial").length;
    const nonCompliant = complianceData.filter(i => i.compliance === "Non-Compliant").length;
    const total = complianceData.length;

    doc += `- **Total Requirements:** ${total}\n`;
    doc += `- **Fully Compliant:** ${compliant} (${((compliant / total) * 100).toFixed(1)}%)\n`;
    doc += `- **Partially Compliant:** ${partial} (${((partial / total) * 100).toFixed(1)}%)\n`;
    doc += `- **Non-Compliant:** ${nonCompliant} (${((nonCompliant / total) * 100).toFixed(1)}%)\n\n`;

    // Action Items
    doc += `## Action Items\n\n`;
    complianceData
      .filter(i => i.compliance !== "Compliant")
      .forEach((item, i) => {
        doc += `${i + 1}. **${item.standard} - ${item.clause}**: `;
        doc += `Achieve full compliance through ${item.justification}\n`;
      });

    return doc;
  }

  /**
   * Generate Test Report
   */
  generateTestReport(mission: MissionData, testPlans: TestPlan[], metadata: DocumentMetadata): string {
    let doc = `# Test Report - ${mission.name}\n\n`;
    doc += `**Version:** ${metadata.version}\n`;
    doc += `**Date:** ${metadata.date}\n`;
    doc += `**Test Campaign:** ${metadata.title}\n\n`;

    // Executive Summary
    doc += `## Executive Summary\n\n`;
    const completed = testPlans.filter(t => t.status === "Complete").length;
    const failed = testPlans.filter(t => t.status === "Failed").length;
    const total = testPlans.length;

    doc += `Test campaign summary:\n`;
    doc += `- **Total Tests:** ${total}\n`;
    doc += `- **Completed:** ${completed}\n`;
    doc += `- **Failed:** ${failed}\n`;
    doc += `- **Success Rate:** ${(((completed - failed) / total) * 100).toFixed(1)}%\n\n`;

    // Test Results
    doc += `## Test Results\n\n`;

    testPlans.forEach((test, i) => {
      doc += `### ${i + 1}. ${test.testName} (${test.testId})\n\n`;
      doc += `**Objective:** ${test.objective}\n\n`;
      doc += `**Procedure:**\n`;
      test.procedure.forEach((step, j) => {
        doc += `${j + 1}. ${step}\n`;
      });
      doc += "\n";
      doc += `**Expected Results:** ${test.expectedResults}\n\n`;
      doc += `**Actual Results:** ${test.actualResults || "TBD"}\n\n`;
      doc += `**Status:** ${test.status}\n`;
      if (test.datePerformed) {
        doc += `**Date Performed:** ${test.datePerformed}\n`;
      }
      if (test.performedBy) {
        doc += `**Performed By:** ${test.performedBy}\n`;
      }
      doc += "\n---\n\n";
    });

    // Non-Conformances
    doc += `## Non-Conformances\n\n`;
    const failedTests = testPlans.filter(t => t.status === "Failed");
    if (failedTests.length > 0) {
      failedTests.forEach((test, i) => {
        doc += `### NCR-${i + 1}: ${test.testName}\n`;
        doc += `- **Description:** Test failed to meet expected results\n`;
        doc += `- **Impact:** TBD\n`;
        doc += `- **Resolution:** TBD\n\n`;
      });
    } else {
      doc += `No non-conformances identified.\n\n`;
    }

    // Recommendations
    doc += `## Recommendations\n\n`;
    doc += `Based on the test results:\n`;
    if (failed > 0) {
      doc += `1. Investigate and resolve ${failed} failed test(s)\n`;
      doc += `2. Perform re-test after corrections\n`;
    } else {
      doc += `1. Proceed to next test phase\n`;
      doc += `2. Update test procedures based on lessons learned\n`;
    }

    return doc;
  }

  /**
   * Generate Flight Readiness Review (FRR) document
   */
  generateFRR(
    mission: MissionData,
    launchDate: Date,
    groundStations: GroundStation[],
    metadata: DocumentMetadata,
  ): string {
    let doc = `# Flight Readiness Review - ${mission.name}\n\n`;
    doc += `**Document Type:** Flight Readiness Review (FRR)\n`;
    doc += `**Version:** ${metadata.version}\n`;
    doc += `**Date:** ${metadata.date}\n`;
    doc += `**Launch Date:** ${launchDate.toISOString()}\n\n`;

    // Go/No-Go Criteria
    doc += `## Go/No-Go Criteria\n\n`;
    doc += `| Criteria | Status | Comments |\n`;
    doc += `|----------|--------|----------|\n`;
    doc += `| Spacecraft Ready | GO | All systems verified |\n`;
    doc += `| Launch Vehicle Ready | GO | Integration complete |\n`;
    doc += `| Ground Segment Ready | GO | ${groundStations.length} stations operational |\n`;
    doc += `| Weather Conditions | TBD | To be assessed T-24h |\n`;
    doc += `| Range Safety | GO | All clearances obtained |\n`;
    doc += `| Mission Operations Ready | GO | Team trained and ready |\n\n`;

    // System Status
    doc += `## System Status\n\n`;
    doc += `### Spacecraft\n`;
    doc += `- All subsystems tested and verified\n`;
    doc += `- Fuel loaded: 100%\n`;
    doc += `- Battery charged: 100%\n`;
    doc += `- Software version: Final\n\n`;

    doc += `### Ground Segment\n`;
    groundStations.forEach(station => {
      doc += `- **${station.name}**: Operational (${station.latitude}°, ${station.longitude}°)\n`;
    });
    doc += "\n";

    // Launch Sequence
    doc += `## Launch Sequence\n\n`;
    doc += `| Time | Event |\n`;
    doc += `|------|-------|\n`;
    doc += `| T-24:00:00 | Launch readiness review |\n`;
    doc += `| T-06:00:00 | Spacecraft power on |\n`;
    doc += `| T-02:00:00 | Final systems check |\n`;
    doc += `| T-00:45:00 | Launch vehicle fueling |\n`;
    doc += `| T-00:10:00 | Terminal countdown |\n`;
    doc += `| T-00:00:00 | Liftoff |\n`;
    doc += `| T+00:10:00 | Stage separation |\n`;
    doc += `| T+00:45:00 | Spacecraft separation |\n`;
    doc += `| T+01:00:00 | First contact |\n\n`;

    // Risk Assessment
    doc += `## Launch Risk Assessment\n\n`;
    doc += `All identified risks have been mitigated or accepted:\n`;
    doc += `- Technical risks: All systems verified\n`;
    doc += `- Weather risks: Monitoring ongoing\n`;
    doc += `- Operational risks: Contingency plans in place\n\n`;

    // Recommendation
    doc += `## Recommendation\n\n`;
    doc += `**The ${mission.name} mission is GO for launch.**\n\n`;
    doc += `All systems have been verified and the mission team is ready to proceed with launch operations.\n`;

    return doc;
  }

  /**
   * Export document to various formats
   */
  exportDocument(content: string, format: "md" | "html" | "pdf" = "md"): string | Blob {
    switch (format) {
      case "md":
        return content;

      case "html":
        // Simple markdown to HTML conversion
        let html = content
          .replace(/^### (.*$)/gim, "<h3>$1</h3>")
          .replace(/^## (.*$)/gim, "<h2>$1</h2>")
          .replace(/^# (.*$)/gim, "<h1>$1</h1>")
          .replace(/^\* (.*$)/gim, "<li>$1</li>")
          .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
          .replace(/\n\n/gim, "</p><p>")
          .replace(/\n/gim, "<br>");

        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    h3 { color: #777; }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>`;
        return html;

      case "pdf":
        // In production, would use a library like jsPDF or puppeteer
        // For now, return a blob with the markdown content
        return new Blob([content], { type: "application/pdf" });

      default:
        return content;
    }
  }

  /**
   * Classify orbit type based on parameters
   */
  private classifyOrbit(orbit: OrbitData): string {
    // Simplified orbit classification
    // In production, would use orbital elements for precise classification
    if (orbit.oem && orbit.oem.ephemerides.length > 0) {
      const altitude =
        Math.sqrt(
          orbit.oem.ephemerides[0].position[0] ** 2 +
            orbit.oem.ephemerides[0].position[1] ** 2 +
            orbit.oem.ephemerides[0].position[2] ** 2,
        ) - 6371; // Earth radius

      if (altitude < 2000) return "Low Earth Orbit (LEO)";
      if (altitude < 35786) return "Medium Earth Orbit (MEO)";
      if (altitude === 35786) return "Geostationary Orbit (GEO)";
      return "High Earth Orbit (HEO)";
    }

    return "TBD";
  }

  /**
   * Generate document filename
   */
  generateFilename(missionName: string, documentType: string, version: string, format: string = "md"): string {
    const sanitized = missionName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const date = new Date().toISOString().split("T")[0];
    return `${sanitized}_${documentType}_v${version}_${date}.${format}`;
  }
}

// Export singleton instance
const documentGenerator = new DocumentGeneratorService();
export default documentGenerator;
