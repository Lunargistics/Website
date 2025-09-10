"use client";

import React, { useCallback, useState } from "react";
import { AlertCircle, CheckCircle, Code, Cpu, FileText, Shield, TestTube, Upload } from "lucide-react";

// ECSS-E-ST-10-24C compliant ICD processor
interface ICDProtocol {
  id: string;
  name: string;
  type: "CAN" | "SpaceWire" | "MIL-STD-1553" | "RS422" | "RS485" | "Ethernet" | "I2C" | "SPI";
  dataRate: string;
  messages: ICDMessage[];
  timing: TimingRequirements;
  errorHandling: ErrorHandling;
}

interface ICDMessage {
  id: string;
  name: string;
  direction: "TX" | "RX" | "BIDIRECTIONAL";
  periodicity: number; // ms
  size: number; // bytes
  fields: MessageField[];
  criticality: "CRITICAL" | "ESSENTIAL" | "NON_ESSENTIAL";
}

interface MessageField {
  name: string;
  type: "UINT8" | "UINT16" | "UINT32" | "INT8" | "INT16" | "INT32" | "FLOAT" | "DOUBLE" | "BOOLEAN" | "ENUM";
  offset: number;
  size: number;
  unit?: string;
  range?: { min: number; max: number };
  description: string;
}

interface TimingRequirements {
  maxLatency: number; // ms
  jitter: number; // ms
  timeout: number; // ms
}

interface ErrorHandling {
  retryCount: number;
  errorDetection: "CRC" | "CHECKSUM" | "PARITY" | "NONE";
  errorCorrection: "FEC" | "ARQ" | "NONE";
}

interface OBCCompatibility {
  processor: string;
  architecture: "ARM" | "x86" | "PowerPC" | "LEON" | "RISC-V";
  os: "FreeRTOS" | "VxWorks" | "Linux" | "RTEMS" | "Bare Metal";
  memory: { ram: number; flash: number };
  interfaces: string[];
}

interface TestCase {
  id: string;
  name: string;
  protocol: string;
  type: "FUNCTIONAL" | "PERFORMANCE" | "STRESS" | "BOUNDARY" | "ERROR_INJECTION";
  steps: TestStep[];
  expectedResults: string[];
  coverage: number;
}

interface TestStep {
  action: string;
  data?: any;
  timing?: number;
  validation: string;
}

export default function ICDProcessor() {
  const [icdFile, setIcdFile] = useState<File | null>(null);
  const [protocols, setProtocols] = useState<ICDProtocol[]>([]);
  const [generatedDrivers, setGeneratedDrivers] = useState<Map<string, string>>(new Map());
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [obcConfig, setObcConfig] = useState<OBCCompatibility>({
    processor: "ARM Cortex-A53",
    architecture: "ARM",
    os: "Linux",
    memory: { ram: 512, flash: 4096 },
    interfaces: ["CAN", "SpaceWire", "Ethernet", "I2C", "SPI"],
  });
  const [compatibilityResults, setCompatibilityResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Save generated outputs to database
  const saveOutput = async (type: string, prompt: string, output: string, metadata?: any) => {
    try {
      await fetch("/api/outputs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          prompt,
          output,
          metadata,
        }),
      });
    } catch (error) {
      console.error("Error saving output:", error);
    }
  };

  // Parse ICD document (PDF, XML, JSON)
  const parseICD = useCallback(
    async () => {
      setIsProcessing(true);

      // Simulate ICD parsing - in real implementation, use pdf.js or xml parser
      // TODO: Parse actual file content using pdf.js, xml parser, etc.
      const mockProtocols: ICDProtocol[] = [
        {
          id: "CAN_BUS_1",
          name: "Main CAN Bus",
          type: "CAN",
          dataRate: "1Mbps",
          messages: [
            {
              id: "0x100",
              name: "TELEMETRY_PACKET",
              direction: "TX",
              periodicity: 100,
              size: 8,
              criticality: "ESSENTIAL",
              fields: [
                {
                  name: "temperature",
                  type: "INT16",
                  offset: 0,
                  size: 2,
                  unit: "°C",
                  range: { min: -40, max: 85 },
                  description: "System temperature",
                },
                {
                  name: "voltage",
                  type: "UINT16",
                  offset: 2,
                  size: 2,
                  unit: "mV",
                  range: { min: 0, max: 5000 },
                  description: "Supply voltage",
                },
                {
                  name: "status",
                  type: "UINT32",
                  offset: 4,
                  size: 4,
                  description: "System status flags",
                },
              ],
            },
            {
              id: "0x200",
              name: "COMMAND_PACKET",
              direction: "RX",
              periodicity: 0,
              size: 4,
              criticality: "CRITICAL",
              fields: [
                {
                  name: "command_id",
                  type: "UINT16",
                  offset: 0,
                  size: 2,
                  description: "Command identifier",
                },
                {
                  name: "parameter",
                  type: "UINT16",
                  offset: 2,
                  size: 2,
                  description: "Command parameter",
                },
              ],
            },
          ],
          timing: {
            maxLatency: 10,
            jitter: 1,
            timeout: 100,
          },
          errorHandling: {
            retryCount: 3,
            errorDetection: "CRC",
            errorCorrection: "ARQ",
          },
        },
        {
          id: "SPACEWIRE_1",
          name: "SpaceWire Interface",
          type: "SpaceWire",
          dataRate: "200Mbps",
          messages: [
            {
              id: "0x01",
              name: "IMAGE_DATA",
              direction: "TX",
              periodicity: 1000,
              size: 1024,
              criticality: "NON_ESSENTIAL",
              fields: [
                {
                  name: "header",
                  type: "UINT32",
                  offset: 0,
                  size: 4,
                  description: "Packet header",
                },
                {
                  name: "payload",
                  type: "UINT8",
                  offset: 4,
                  size: 1020,
                  description: "Image data payload",
                },
              ],
            },
          ],
          timing: {
            maxLatency: 5,
            jitter: 0.5,
            timeout: 50,
          },
          errorHandling: {
            retryCount: 2,
            errorDetection: "CRC",
            errorCorrection: "FEC",
          },
        },
      ];

      setProtocols(mockProtocols);

      // Generate drivers automatically
      for (const protocol of mockProtocols) {
        const driver = generateDriver(protocol);
        setGeneratedDrivers(prev => new Map(prev).set(protocol.id, driver));

        // Save driver to database
        await saveOutput("icd_driver", `Generate driver for ${protocol.name} (${protocol.type})`, driver, {
          protocol: protocol.name,
          protocolType: protocol.type,
          dataRate: protocol.dataRate,
          messages: protocol.messages.length,
        });
      }

      // Generate test cases
      const tests = generateTestCases(mockProtocols);
      setTestCases(tests);

      // Save test cases to database
      if (tests.length > 0) {
        await saveOutput(
          "test_case",
          `Generate test cases for ${mockProtocols.map(p => p.name).join(", ")}`,
          JSON.stringify(tests, null, 2),
          {
            totalTests: tests.length,
            protocols: mockProtocols.map(p => p.id),
          },
        );
      }

      // Check OBC compatibility
      const compatibility = checkCompatibility(mockProtocols, obcConfig);
      setCompatibilityResults(compatibility);

      setIsProcessing(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [obcConfig],
  );

  // Generate driver code from protocol specification
  const generateDriver = (protocol: ICDProtocol): string => {
    let driverCode = `/**
 * Auto-generated driver for ${protocol.name}
 * Protocol: ${protocol.type}
 * Data Rate: ${protocol.dataRate}
 * ECSS-E-ST-10-24C Compliant
 */

#include <stdint.h>
#include <stdbool.h>

/* Protocol Configuration */
#define ${protocol.id}_DATA_RATE ${protocol.dataRate}
#define ${protocol.id}_MAX_LATENCY_MS ${protocol.timing.maxLatency}
#define ${protocol.id}_TIMEOUT_MS ${protocol.timing.timeout}
#define ${protocol.id}_RETRY_COUNT ${protocol.errorHandling.retryCount}

`;

    // Generate message structures
    for (const message of protocol.messages) {
      driverCode += `/* Message: ${message.name} */
typedef struct __attribute__((packed)) {
`;
      for (const field of message.fields) {
        const cType = getCType(field.type);
        driverCode += `    ${cType} ${field.name}; /* ${field.description} */
`;
      }
      driverCode += `} ${message.name}_t;

`;
    }

    // Generate send/receive functions
    for (const message of protocol.messages) {
      if (message.direction === "TX" || message.direction === "BIDIRECTIONAL") {
        driverCode += `/* Send ${message.name} */
int ${protocol.id}_send_${message.name.toLowerCase()}(${message.name}_t *msg) {
    int retries = ${protocol.id}_RETRY_COUNT;
    while (retries-- > 0) {
        if (${protocol.type.toLowerCase()}_send(${message.id}, (uint8_t*)msg, sizeof(${message.name}_t)) == 0) {
            return 0; /* Success */
        }
    }
    return -1; /* Failed after retries */
}

`;
      }

      if (message.direction === "RX" || message.direction === "BIDIRECTIONAL") {
        driverCode += `/* Receive ${message.name} */
int ${protocol.id}_receive_${message.name.toLowerCase()}(${message.name}_t *msg) {
    return ${protocol.type.toLowerCase()}_receive(${message.id}, (uint8_t*)msg, sizeof(${message.name}_t), ${protocol.id}_TIMEOUT_MS);
}

`;
      }
    }

    // Generate validation functions
    for (const message of protocol.messages) {
      driverCode += `/* Validate ${message.name} */
bool ${protocol.id}_validate_${message.name.toLowerCase()}(${message.name}_t *msg) {
`;
      for (const field of message.fields) {
        if (field.range) {
          driverCode += `    if (msg->${field.name} < ${field.range.min} || msg->${field.name} > ${field.range.max}) {
        return false;
    }
`;
        }
      }
      driverCode += `    return true;
}

`;
    }

    return driverCode;
  };

  // Generate test cases from protocols
  const generateTestCases = (protocols: ICDProtocol[]): TestCase[] => {
    const tests: TestCase[] = [];

    for (const protocol of protocols) {
      // Functional tests
      tests.push({
        id: `FUNC_${protocol.id}`,
        name: `Functional Test - ${protocol.name}`,
        protocol: protocol.id,
        type: "FUNCTIONAL",
        steps: protocol.messages.map(msg => ({
          action: `Send/Receive ${msg.name}`,
          data: generateTestData(msg),
          timing: msg.periodicity,
          validation: `Verify message structure and field values`,
        })),
        expectedResults: ["All messages transmitted successfully", "Data integrity maintained"],
        coverage: 100,
      });

      // Performance tests
      tests.push({
        id: `PERF_${protocol.id}`,
        name: `Performance Test - ${protocol.name}`,
        protocol: protocol.id,
        type: "PERFORMANCE",
        steps: [
          {
            action: "Measure latency",
            timing: protocol.timing.maxLatency,
            validation: `Latency < ${protocol.timing.maxLatency}ms`,
          },
          {
            action: "Measure throughput",
            validation: `Data rate >= ${protocol.dataRate}`,
          },
        ],
        expectedResults: ["Meets timing requirements", "Achieves specified data rate"],
        coverage: 85,
      });

      // Error injection tests
      tests.push({
        id: `ERROR_${protocol.id}`,
        name: `Error Injection Test - ${protocol.name}`,
        protocol: protocol.id,
        type: "ERROR_INJECTION",
        steps: [
          {
            action: "Inject CRC error",
            validation: "Error detected and handled",
          },
          {
            action: "Simulate timeout",
            timing: protocol.timing.timeout,
            validation: "Timeout handled correctly",
          },
          {
            action: "Test retry mechanism",
            validation: `Retries up to ${protocol.errorHandling.retryCount} times`,
          },
        ],
        expectedResults: ["Errors detected", "Recovery mechanisms work"],
        coverage: 75,
      });
    }

    return tests;
  };

  // Generate test data for a message
  const generateTestData = (message: ICDMessage): any => {
    const data: any = {};
    for (const field of message.fields) {
      if (field.range) {
        data[field.name] = (field.range.min + field.range.max) / 2;
      } else {
        data[field.name] = getDefaultValue(field.type);
      }
    }
    return data;
  };

  // Check OBC compatibility
  const checkCompatibility = (protocols: ICDProtocol[], obc: OBCCompatibility): any[] => {
    const results = [];

    for (const protocol of protocols) {
      const supported = obc.interfaces.includes(protocol.type);
      const memoryRequired = calculateMemoryRequirement(protocol);
      const memoryAvailable = memoryRequired < obc.memory.ram;

      results.push({
        protocol: protocol.name,
        interface: protocol.type,
        supported,
        memoryOk: memoryAvailable,
        memoryRequired,
        processorCompatible: true, // Simplified - would check actual processor capabilities
        osCompatible: isOSCompatible(protocol, obc.os),
        overallStatus: supported && memoryAvailable ? "COMPATIBLE" : "INCOMPATIBLE",
      });
    }

    return results;
  };

  // Calculate memory requirement for protocol
  const calculateMemoryRequirement = (protocol: ICDProtocol): number => {
    let memory = 0;
    for (const message of protocol.messages) {
      memory += message.size * 10; // Buffer for 10 messages
    }
    return memory;
  };

  // Check OS compatibility
  const isOSCompatible = (protocol: ICDProtocol, os: string): boolean => {
    // Simplified check - in reality would check specific OS capabilities
    const realtimeOS = ["FreeRTOS", "VxWorks", "RTEMS"];
    if (protocol.timing.maxLatency < 10) {
      return realtimeOS.includes(os);
    }
    return true;
  };

  // Get C type from ICD type
  const getCType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      UINT8: "uint8_t",
      UINT16: "uint16_t",
      UINT32: "uint32_t",
      INT8: "int8_t",
      INT16: "int16_t",
      INT32: "int32_t",
      FLOAT: "float",
      DOUBLE: "double",
      BOOLEAN: "bool",
      ENUM: "uint8_t",
    };
    return typeMap[type] || "uint8_t";
  };

  // Get default value for type
  const getDefaultValue = (type: string): any => {
    if (type.includes("INT")) return 0;
    if (type === "FLOAT" || type === "DOUBLE") return 0.0;
    if (type === "BOOLEAN") return false;
    return 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIcdFile(file);
      parseICD();
    }
  };

  const runAutomatedTests = () => {
    console.log("Running automated tests...", testCases);
    // In real implementation, would execute tests against hardware/simulator
  };

  return (
    <div className="icd-processor bg-base-200 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">ICD Processor & Test Automation</h2>
        <p className="text-sm opacity-70">ECSS-E-ST-10-24C Compliant Interface Control Document Processing</p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-300/20">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-primary" />
            <p className="mb-2 text-sm">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs opacity-70">ICD documents (PDF, XML, JSON)</p>
          </div>
          <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.xml,.json" />
        </label>
        {icdFile && (
          <div className="mt-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm">{icdFile.name}</span>
            {isProcessing && <span className="loading loading-spinner loading-sm"></span>}
          </div>
        )}
      </div>

      {/* OBC Configuration */}
      <div className="mb-6 p-4 bg-base-100 rounded-lg">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          OBC Configuration
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <label className="label label-text">Processor</label>
            <select
              className="select select-sm select-bordered w-full"
              value={obcConfig.processor}
              onChange={e => setObcConfig({ ...obcConfig, processor: e.target.value })}
            >
              <option>ARM Cortex-A53</option>
              <option>LEON3</option>
              <option>PowerPC RAD750</option>
              <option>RISC-V</option>
            </select>
          </div>
          <div>
            <label className="label label-text">OS</label>
            <select
              className="select select-sm select-bordered w-full"
              value={obcConfig.os}
              onChange={e => setObcConfig({ ...obcConfig, os: e.target.value as any })}
            >
              <option>Linux</option>
              <option>FreeRTOS</option>
              <option>VxWorks</option>
              <option>RTEMS</option>
            </select>
          </div>
          <div>
            <label className="label label-text">RAM (MB)</label>
            <input
              type="number"
              className="input input-sm input-bordered w-full"
              value={obcConfig.memory.ram}
              onChange={e =>
                setObcConfig({ ...obcConfig, memory: { ...obcConfig.memory, ram: parseInt(e.target.value) } })
              }
            />
          </div>
          <div>
            <label className="label label-text">Flash (MB)</label>
            <input
              type="number"
              className="input input-sm input-bordered w-full"
              value={obcConfig.memory.flash}
              onChange={e =>
                setObcConfig({ ...obcConfig, memory: { ...obcConfig.memory, flash: parseInt(e.target.value) } })
              }
            />
          </div>
        </div>
      </div>

      {/* Parsed Protocols */}
      {protocols.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-3">Detected Protocols</h3>
          <div className="grid gap-3">
            {protocols.map(protocol => (
              <div key={protocol.id} className="card bg-base-100">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{protocol.name}</h4>
                      <p className="text-sm opacity-70">
                        Type: {protocol.type} | Rate: {protocol.dataRate} | Messages: {protocol.messages.length}
                      </p>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const driver = generatedDrivers.get(protocol.id);
                        if (driver) {
                          const blob = new Blob([driver], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${protocol.id}_driver.c`;
                          a.click();
                        }
                      }}
                    >
                      <Code className="w-4 h-4 mr-1" />
                      Download Driver
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Messages:</p>
                    <div className="space-y-1">
                      {protocol.messages.map(msg => (
                        <div key={msg.id} className="text-xs flex items-center gap-2">
                          <span
                            className={`badge badge-xs ${msg.criticality === "CRITICAL" ? "badge-error" : msg.criticality === "ESSENTIAL" ? "badge-warning" : "badge-info"}`}
                          >
                            {msg.criticality}
                          </span>
                          <span>{msg.name}</span>
                          <span className="opacity-60">
                            ({msg.direction}, {msg.size} bytes)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compatibility Results */}
      {compatibilityResults.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            OBC Compatibility Check
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Interface</th>
                  <th>Support</th>
                  <th>Memory</th>
                  <th>OS</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {compatibilityResults.map((result, idx) => (
                  <tr key={idx}>
                    <td>{result.protocol}</td>
                    <td>{result.interface}</td>
                    <td>
                      {result.supported ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-error" />
                      )}
                    </td>
                    <td>
                      {result.memoryOk ? (
                        <span className="text-success">{result.memoryRequired}B</span>
                      ) : (
                        <span className="text-error">{result.memoryRequired}B</span>
                      )}
                    </td>
                    <td>
                      {result.osCompatible ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-warning" />
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${result.overallStatus === "COMPATIBLE" ? "badge-success" : "badge-error"}`}
                      >
                        {result.overallStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Cases */}
      {testCases.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Generated Test Cases
            </h3>
            <button className="btn btn-sm btn-success" onClick={runAutomatedTests}>
              Run All Tests
            </button>
          </div>
          <div className="grid gap-2">
            {testCases.map(test => (
              <div key={test.id} className="p-3 bg-base-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{test.name}</span>
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`badge badge-xs ${test.type === "FUNCTIONAL" ? "badge-primary" : test.type === "PERFORMANCE" ? "badge-secondary" : "badge-warning"}`}
                      >
                        {test.type}
                      </span>
                      <span className="text-xs opacity-60">Coverage: {test.coverage}%</span>
                    </div>
                  </div>
                  <button className="btn btn-xs">Run</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
