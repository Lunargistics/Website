/**
 * Interface Control Document (ICD) Generator Service
 * Generates comprehensive interface documentation for mission components
 * Implements requirement MP-STD-4
 */
import { CommandDefinition, InterfaceDefinition } from "../drivers/driverGenerator";
import { EquipmentData } from "../ipfs/pinataService";

export interface ICDMetadata {
  documentNumber: string;
  version: string;
  releaseDate: string;
  classification: "PUBLIC" | "CONFIDENTIAL" | "SECRET";
  authors: string[];
  reviewers: string[];
  approvers: string[];
  changeHistory: ChangeRecord[];
}

export interface ChangeRecord {
  version: string;
  date: string;
  author: string;
  description: string;
  affectedSections: string[];
}

export interface InterfaceConnection {
  sourceComponent: string;
  sourceInterface: string;
  targetComponent: string;
  targetInterface: string;
  connectionType: "direct" | "bus" | "network" | "wireless";
  protocol: string;
  dataRate: number;
  bidirectional: boolean;
}

export interface SignalDefinition {
  name: string;
  direction: "input" | "output" | "bidirectional";
  type: "digital" | "analog" | "differential" | "power" | "ground";
  voltage: { min: number; nominal: number; max: number };
  current?: { min: number; nominal: number; max: number };
  frequency?: number;
  impedance?: number;
  description: string;
}

export interface DataPacketDefinition {
  name: string;
  id: string;
  size: number;
  structure: PacketField[];
  frequency: number;
  priority: "critical" | "high" | "normal" | "low";
  errorChecking: "crc" | "checksum" | "parity" | "none";
}

export interface PacketField {
  name: string;
  offset: number;
  size: number;
  type: string;
  endianness: "big" | "little";
  description: string;
  validation?: string;
}

export interface TimingDiagram {
  name: string;
  signals: TimingSignal[];
  timeScale: string; // e.g., "µs", "ms", "s"
  totalDuration: number;
}

export interface TimingSignal {
  name: string;
  events: TimingEvent[];
}

export interface TimingEvent {
  time: number;
  value: "high" | "low" | "z" | "x" | number;
  duration?: number;
}

class ICDGeneratorService {
  /**
   * Generate complete ICD document
   */
  generateICD(
    components: EquipmentData[],
    interfaces: Map<string, InterfaceDefinition>,
    connections: InterfaceConnection[],
    metadata: ICDMetadata,
  ): string {
    let doc = this.generateHeader(metadata);
    doc += this.generateTableOfContents();
    doc += this.generateIntroduction(components, metadata);
    doc += this.generateScope(components, interfaces);
    doc += this.generateReferences();
    doc += this.generateInterfaceOverview(components, connections);
    doc += this.generateDetailedInterfaces(interfaces);
    doc += this.generateConnectionMatrix(connections);
    doc += this.generateDataFormats(interfaces);
    doc += this.generateTimingRequirements(interfaces);
    doc += this.generateElectricalCharacteristics(interfaces);
    doc += this.generateProtocolDescriptions(interfaces);
    doc += this.generateErrorHandling(interfaces);
    doc += this.generateTestProcedures(interfaces);
    doc += this.generateAppendices(metadata);

    return doc;
  }

  /**
   * Generate ICD header
   */
  private generateHeader(metadata: ICDMetadata): string {
    return `# Interface Control Document (ICD)

**Document Number:** ${metadata.documentNumber}  
**Version:** ${metadata.version}  
**Release Date:** ${metadata.releaseDate}  
**Classification:** ${metadata.classification}  

---

## Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Author | ${metadata.authors.join(", ")} | __________ | __________ |
| Reviewer | ${metadata.reviewers.join(", ")} | __________ | __________ |
| Approver | ${metadata.approvers.join(", ")} | __________ | __________ |

---

## Change History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
${metadata.changeHistory
  .map(change => `| ${change.version} | ${change.date} | ${change.author} | ${change.description} |`)
  .join("\n")}

---

`;
  }

  /**
   * Generate table of contents
   */
  private generateTableOfContents(): string {
    return `## Table of Contents

1. [Introduction](#1-introduction)
2. [Scope](#2-scope)
3. [References](#3-references)
4. [Interface Overview](#4-interface-overview)
5. [Detailed Interface Descriptions](#5-detailed-interface-descriptions)
6. [Connection Matrix](#6-connection-matrix)
7. [Data Formats](#7-data-formats)
8. [Timing Requirements](#8-timing-requirements)
9. [Electrical Characteristics](#9-electrical-characteristics)
10. [Protocol Descriptions](#10-protocol-descriptions)
11. [Error Handling](#11-error-handling)
12. [Test Procedures](#12-test-procedures)
13. [Appendices](#13-appendices)

---

`;
  }

  /**
   * Generate introduction section
   */
  private generateIntroduction(components: EquipmentData[], _metadata: ICDMetadata): string {
    return `## 1. Introduction

### 1.1 Purpose

This Interface Control Document (ICD) defines the interfaces between the following components:

${components.map(c => `- ${c.name} (${c.manufacturer})`).join("\n")}

The document serves as the authoritative reference for all hardware and software interfaces, ensuring compatibility and interoperability between system components.

### 1.2 Document Overview

This ICD is organized into the following major sections:

- **Interface Overview**: High-level description of all interfaces
- **Detailed Descriptions**: Complete specifications for each interface
- **Data Formats**: Message and packet structures
- **Timing Requirements**: Temporal constraints and synchronization
- **Electrical Characteristics**: Signal levels and power requirements
- **Protocol Descriptions**: Communication protocols and handshaking
- **Error Handling**: Fault detection and recovery procedures
- **Test Procedures**: Verification and validation methods

### 1.3 Revision Control

This document is maintained under configuration control. Any changes must be approved by the Interface Control Board (ICB) and documented in the change history.

---

`;
  }

  /**
   * Generate scope section
   */
  private generateScope(components: EquipmentData[], interfaces: Map<string, InterfaceDefinition>): string {
    return `## 2. Scope

### 2.1 System Context

This ICD applies to the interfaces between the following subsystems:

\`\`\`mermaid
graph TD
${components.map((c, i) => `    C${i}[${c.name}]`).join("\n")}
${Array.from(interfaces.entries())
  .map(([_name, def], i) => `    C0 -->|${def.type}| C${i + 1}`)
  .join("\n")}
\`\`\`

### 2.2 Interface Types Covered

The following interface types are defined in this document:

${Array.from(new Set(Array.from(interfaces.values()).map(i => i.type)))
  .map(type => `- **${type.toUpperCase()}**: ${this.getInterfaceTypeDescription(type)}`)
  .join("\n")}

### 2.3 Out of Scope

The following items are explicitly excluded from this ICD:

- Internal component interfaces not exposed externally
- Ground support equipment interfaces (covered in separate ICD)
- Human-machine interfaces (covered in UI specification)
- Manufacturing and test interfaces (covered in AIT documentation)

---

`;
  }

  /**
   * Generate references section
   */
  private generateReferences(): string {
    return `## 3. References

### 3.1 Applicable Documents

The following documents form a part of this specification:

| Document ID | Title | Revision |
|-------------|-------|----------|
| ECSS-E-ST-50-12C | SpaceWire - Links, nodes, routers and networks | Rev. 1 |
| ECSS-E-ST-50-13C | Interface and communication protocol | Rev. 1 |
| CCSDS 133.0-B-1 | Space Packet Protocol | Blue Book |
| MIL-STD-1553B | Aircraft Internal Time Division Multiplex Data Bus | Notice 4 |
| RS-422 | Electrical Characteristics of Balanced Voltage | TIA/EIA |
| CAN 2.0B | Controller Area Network Specification | Version 2.0 |

### 3.2 Reference Documents

The following documents provide additional context:

- System Requirements Specification (SRS)
- Software Design Document (SDD)  
- Hardware Design Specification (HDS)
- Mission Operations Concept (MOC)
- Ground System ICD (GS-ICD)

---

`;
  }

  /**
   * Generate interface overview
   */
  private generateInterfaceOverview(components: EquipmentData[], connections: InterfaceConnection[]): string {
    let overview = `## 4. Interface Overview

### 4.1 Interface Architecture

The system employs a distributed architecture with the following interface topology:

\`\`\`
${this.generateASCIIDiagram(components, connections)}
\`\`\`

### 4.2 Interface Summary Table

| Interface ID | Source | Target | Type | Protocol | Data Rate | Criticality |
|-------------|--------|--------|------|----------|-----------|-------------|
`;

    connections.forEach((conn, i) => {
      overview += `| IF-${String(i + 1).padStart(3, "0")} | ${conn.sourceComponent} | ${conn.targetComponent} | ${conn.connectionType} | ${conn.protocol} | ${conn.dataRate} bps | High |\n`;
    });

    overview += `
### 4.3 Data Flow Overview

The primary data flows through the system are:

1. **Command Flow**: Ground → Spacecraft Bus → Subsystems
2. **Telemetry Flow**: Subsystems → Spacecraft Bus → Ground
3. **Payload Data Flow**: Sensors → Processing → Storage → Downlink
4. **Health & Status**: All components → Monitoring System

### 4.4 Interface Criticality Matrix

| Interface | Mission Critical | Safety Critical | Single Point Failure | Redundancy |
|-----------|-----------------|-----------------|---------------------|------------|
`;

    connections.forEach(conn => {
      const critical = conn.dataRate > 1000000 ? "Yes" : "No";
      overview += `| ${conn.sourceInterface} | ${critical} | No | ${critical} | ${critical === "Yes" ? "Dual" : "None"} |\n`;
    });

    overview += `
---

`;

    return overview;
  }

  /**
   * Generate detailed interface descriptions
   */
  private generateDetailedInterfaces(interfaces: Map<string, InterfaceDefinition>): string {
    let details = `## 5. Detailed Interface Descriptions

`;

    let ifNum = 1;
    interfaces.forEach((iface, name) => {
      details += `### 5.${ifNum} ${name}

#### 5.${ifNum}.1 General Description

**Interface Type:** ${iface.type.toUpperCase()}  
**Protocol:** ${iface.protocol}  
**Data Rate:** ${iface.dataRate} bps  
**Voltage:** ${iface.voltage || "TBD"} V  

#### 5.${ifNum}.2 Physical Interface

`;

      if (iface.pinout && iface.pinout.length > 0) {
        details += `| Pin | Signal | Direction | Voltage | Description |
|-----|--------|-----------|---------|-------------|
`;
        iface.pinout.forEach(pin => {
          details += `| ${pin.pin} | ${pin.signal} | ${pin.direction} | ${pin.voltage}V | ${pin.description} |\n`;
        });
        details += "\n";
      }

      details += `#### 5.${ifNum}.3 Commands

`;

      if (iface.commands.length > 0) {
        details += `| Command | Opcode | Parameters | Response | Description |
|---------|--------|------------|----------|-------------|
`;
        iface.commands.forEach(cmd => {
          const params = cmd.parameters.map(p => p.name).join(", ") || "None";
          const response = cmd.response ? "Yes" : "No";
          details += `| ${cmd.name} | 0x${cmd.opcode} | ${params} | ${response} | ${cmd.description} |\n`;
        });
        details += "\n";
      }

      details += `#### 5.${ifNum}.4 Telemetry

`;

      if (iface.telemetry.length > 0) {
        details += `| Telemetry | Rate | Size | Fields | Description |
|-----------|------|------|--------|-------------|
`;
        iface.telemetry.forEach(tlm => {
          const fields = tlm.fields.length;
          details += `| ${tlm.name} | ${tlm.rate} Hz | ${tlm.size} bytes | ${fields} | ${tlm.name} data |\n`;
        });
        details += "\n";
      }

      details += `#### 5.${ifNum}.5 Timing Requirements

`;

      if (iface.timing) {
        details += `- **Setup Time:** ${iface.timing.setupTime || "N/A"} ns
- **Hold Time:** ${iface.timing.holdTime || "N/A"} ns
- **Clock Frequency:** ${iface.timing.clockFrequency || "N/A"} Hz
- **Timeout:** ${iface.timing.timeout || "N/A"} ms

`;
      }

      ifNum++;
    });

    return details;
  }

  /**
   * Generate connection matrix
   */
  private generateConnectionMatrix(connections: InterfaceConnection[]): string {
    const components = new Set<string>();
    connections.forEach(conn => {
      components.add(conn.sourceComponent);
      components.add(conn.targetComponent);
    });

    const compArray = Array.from(components);

    let matrix = `## 6. Connection Matrix

### 6.1 Component Interconnection Matrix

|   | ${compArray.join(" | ")} |
|---|${compArray.map(() => "---").join("|")}|
`;

    compArray.forEach(source => {
      let row = `| ${source} |`;
      compArray.forEach(target => {
        const conn = connections.find(c => c.sourceComponent === source && c.targetComponent === target);
        row += conn ? ` ${conn.connectionType} |` : " - |";
      });
      matrix += row + "\n";
    });

    matrix += `
### 6.2 Connector Assignments

| Component | Connector | Type | Gender | Pin Count | Keying |
|-----------|-----------|------|--------|-----------|--------|
`;

    compArray.forEach(comp => {
      matrix += `| ${comp} | J1 | D-SUB | Male | 25 | A |\n`;
      matrix += `| ${comp} | J2 | Micro-D | Female | 15 | B |\n`;
    });

    matrix += `
### 6.3 Cable Specifications

| Cable ID | From | To | Type | Length | Shield | AWG |
|----------|------|-----|------|--------|--------|-----|
`;

    connections.forEach((conn, i) => {
      matrix += `| CBL-${String(i + 1).padStart(3, "0")} | ${conn.sourceComponent} | ${conn.targetComponent} | ${conn.protocol} | 1.5m | Yes | 24 |\n`;
    });

    matrix += `
---

`;

    return matrix;
  }

  /**
   * Generate data formats section
   */
  private generateDataFormats(interfaces: Map<string, InterfaceDefinition>): string {
    let formats = `## 7. Data Formats

### 7.1 General Packet Structure

All data packets follow the CCSDS Space Packet Protocol with the following structure:

\`\`\`
+------------------+------------------+------------------+
|  Primary Header  | Secondary Header |   User Data      |
|    (6 bytes)     |   (variable)     |   (variable)     |
+------------------+------------------+------------------+
\`\`\`

### 7.2 Command Packet Formats

`;

    interfaces.forEach((iface, name) => {
      if (iface.commands.length > 0) {
        formats += `#### ${name} Commands\n\n`;

        iface.commands.forEach(cmd => {
          formats += `**${cmd.name} Command (0x${cmd.opcode})**\n\n`;
          formats += `\`\`\`\n`;
          formats += this.generatePacketDiagram(cmd);
          formats += `\`\`\`\n\n`;

          if (cmd.parameters.length > 0) {
            formats += `Parameters:\n`;
            cmd.parameters.forEach(param => {
              formats += `- **${param.name}** (${param.type}): ${param.description}`;
              if (param.range) {
                formats += ` [Range: ${param.range.min}-${param.range.max}]`;
              }
              formats += "\n";
            });
            formats += "\n";
          }
        });
      }
    });

    formats += `### 7.3 Telemetry Packet Formats

`;

    interfaces.forEach((iface, name) => {
      if (iface.telemetry.length > 0) {
        formats += `#### ${name} Telemetry\n\n`;

        iface.telemetry.forEach(tlm => {
          formats += `**${tlm.name} Telemetry**\n\n`;
          formats += `- **Rate:** ${tlm.rate} Hz\n`;
          formats += `- **Size:** ${tlm.size} bytes\n\n`;

          formats += `| Field | Offset | Size | Type | Unit | Description |\n`;
          formats += `|-------|--------|------|------|------|-------------|\n`;

          tlm.fields.forEach(field => {
            formats += `| ${field.name} | ${field.offset} | ${field.size} | ${field.type} | ${field.unit || "-"} | ${field.description} |\n`;
          });
          formats += "\n";
        });
      }
    });

    formats += `### 7.4 Error Codes

| Code | Hex | Name | Description | Recovery Action |
|------|-----|------|-------------|-----------------|
| 0 | 0x00 | SUCCESS | Operation completed successfully | None |
| 1 | 0x01 | TIMEOUT | Operation timed out | Retry |
| 2 | 0x02 | CRC_ERROR | CRC check failed | Retransmit |
| 3 | 0x03 | INVALID_CMD | Invalid command received | Check command |
| 4 | 0x04 | INVALID_PARAM | Invalid parameter value | Correct parameter |
| 5 | 0x05 | BUFFER_OVERFLOW | Buffer overflow detected | Reduce data rate |
| 6 | 0x06 | HARDWARE_FAULT | Hardware fault detected | Reset hardware |
| 7 | 0x07 | NOT_READY | System not ready | Wait and retry |

---

`;

    return formats;
  }

  /**
   * Generate timing requirements section
   */
  private generateTimingRequirements(interfaces: Map<string, InterfaceDefinition>): string {
    return `## 8. Timing Requirements

### 8.1 System Timing Overview

The system operates with the following timing constraints:

- **System Clock:** 10 MHz ± 100 ppm
- **Frame Rate:** 1 Hz for housekeeping, 10 Hz for control
- **Latency Budget:** < 100 ms end-to-end
- **Time Synchronization:** GPS time reference, 1 µs accuracy

### 8.2 Interface Timing Specifications

${Array.from(interfaces.entries())
  .map(
    ([name, iface]) => `
#### ${name}

| Parameter | Min | Typical | Max | Unit |
|-----------|-----|---------|-----|------|
| Setup Time | ${iface.timing?.setupTime || 10} | ${(iface.timing?.setupTime || 10) * 1.5} | ${(iface.timing?.setupTime || 10) * 2} | ns |
| Hold Time | ${iface.timing?.holdTime || 5} | ${(iface.timing?.holdTime || 5) * 1.5} | ${(iface.timing?.holdTime || 5) * 2} | ns |
| Clock Period | ${iface.timing?.clockFrequency ? 1000000000 / iface.timing.clockFrequency : 100} | - | - | ns |
| Timeout | - | ${iface.timing?.timeout || 1000} | ${(iface.timing?.timeout || 1000) * 2} | ms |
`,
  )
  .join("\n")}

### 8.3 Timing Diagrams

\`\`\`
Clock   ___⎴‾⎴___⎴‾⎴___⎴‾⎴___⎴‾⎴___
        
Data    ----<  Valid Data   >--------
        
Enable  ____⎴‾‾‾‾‾‾‾‾‾‾‾‾‾‾⎴_______
        
Ready   ‾‾‾‾⎴_______________⎴‾‾‾‾‾‾‾
        
        |<->| Setup |<->| Hold
\`\`\`

### 8.4 Synchronization Requirements

- All subsystems shall synchronize to the master clock within 1 ms
- Time-critical commands shall be executed within 10 ms of receipt
- Telemetry timestamps shall have 1 ms resolution minimum
- Clock drift shall not exceed 1 second per day without resynchronization

---

`;
  }

  /**
   * Generate electrical characteristics section
   */
  private generateElectricalCharacteristics(_interfaces: Map<string, InterfaceDefinition>): string {
    return `## 9. Electrical Characteristics

### 9.1 Power Supply Requirements

| Parameter | Min | Nominal | Max | Unit |
|-----------|-----|---------|-----|------|
| Main Bus Voltage | 27 | 28 | 29 | V |
| Logic Supply | 3.0 | 3.3 | 3.6 | V |
| Analog Supply | 4.75 | 5.0 | 5.25 | V |
| Power Consumption | - | 50 | 75 | W |

### 9.2 Signal Levels

#### Digital Signals (3.3V CMOS)

| Parameter | Min | Max | Unit |
|-----------|-----|-----|------|
| VIL (Input Low) | -0.3 | 0.8 | V |
| VIH (Input High) | 2.0 | 3.6 | V |
| VOL (Output Low) | 0 | 0.4 | V |
| VOH (Output High) | 2.4 | 3.3 | V |

#### Differential Signals (LVDS)

| Parameter | Min | Typical | Max | Unit |
|-----------|-----|---------|-----|------|
| Differential Voltage | 247 | 350 | 454 | mV |
| Common Mode Voltage | 1.0 | 1.2 | 1.4 | V |
| Termination Resistance | 90 | 100 | 110 | Ω |

### 9.3 Grounding and Shielding

- All shields shall be connected to chassis ground at one end only
- Signal ground and chassis ground shall be connected at a single point
- Differential signals shall use twisted pair cables
- High-speed signals (>10 MHz) shall use controlled impedance traces

### 9.4 EMI/EMC Requirements

- Conducted emissions: MIL-STD-461G CE102
- Radiated emissions: MIL-STD-461G RE102
- Conducted susceptibility: MIL-STD-461G CS114
- Radiated susceptibility: MIL-STD-461G RS103

---

`;
  }

  /**
   * Generate protocol descriptions
   */
  private generateProtocolDescriptions(interfaces: Map<string, InterfaceDefinition>): string {
    return `## 10. Protocol Descriptions

### 10.1 Communication Protocol Stack

\`\`\`
+------------------------+
|   Application Layer    |
+------------------------+
|   Presentation Layer   |
+------------------------+
|    Session Layer       |
+------------------------+
|   Transport Layer      |
+------------------------+
|    Network Layer       |
+------------------------+
|   Data Link Layer      |
+------------------------+
|   Physical Layer       |
+------------------------+
\`\`\`

### 10.2 Protocol State Machines

${Array.from(interfaces.entries())
  .map(
    ([name, _iface]) => `
#### ${name} Protocol

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Initializing: Power On
    Initializing --> Ready: Init Complete
    Ready --> Transmitting: Send Command
    Transmitting --> WaitingResponse: Command Sent
    WaitingResponse --> Ready: Response Received
    WaitingResponse --> Error: Timeout
    Error --> Idle: Reset
    Ready --> Receiving: Data Available
    Receiving --> Processing: Data Received
    Processing --> Ready: Process Complete
\`\`\`
`,
  )
  .join("\n")}

### 10.3 Message Sequencing

#### Normal Command/Response Sequence

\`\`\`mermaid
sequenceDiagram
    participant M as Master
    participant S as Slave
    M->>S: Command
    S->>S: Process
    S->>M: ACK
    S->>S: Execute
    S->>M: Response
    M->>S: ACK
\`\`\`

#### Error Recovery Sequence

\`\`\`mermaid
sequenceDiagram
    participant M as Master
    participant S as Slave
    M->>S: Command
    Note over S: Timeout
    M->>S: Retry 1
    S->>M: NAK (Busy)
    M->>M: Wait
    M->>S: Retry 2
    S->>M: ACK
    S->>M: Response
\`\`\`

---

`;
  }

  /**
   * Generate error handling section
   */
  private generateErrorHandling(_interfaces: Map<string, InterfaceDefinition>): string {
    return `## 11. Error Handling

### 11.1 Error Detection Methods

| Method | Description | Coverage | Overhead |
|--------|-------------|----------|----------|
| CRC-16 | 16-bit cyclic redundancy check | 99.998% | 2 bytes |
| Parity | Single bit parity check | 50% | 1 bit |
| Checksum | 8-bit arithmetic sum | 99.6% | 1 byte |
| Sequence Number | Packet sequence tracking | 100% missing | 2 bytes |
| Timeout | Response time monitoring | 100% no response | 0 bytes |

### 11.2 Error Recovery Procedures

#### Level 1 - Automatic Retry

1. Detect error (CRC fail, timeout, NAK)
2. Increment retry counter
3. If counter < max_retries (3):
   - Wait backoff time (counter * 100ms)
   - Retransmit message
4. Else proceed to Level 2

#### Level 2 - Reset Interface

1. Log error condition
2. Notify system controller
3. Reset interface hardware
4. Reinitialize protocol
5. If successful, resume operations
6. Else proceed to Level 3

#### Level 3 - Switch to Redundant Path

1. Mark primary interface as failed
2. Switch to backup interface
3. Notify ground control
4. Continue operations on backup
5. Schedule maintenance

### 11.3 Error Logging

All errors shall be logged with the following information:

- Timestamp (1 ms resolution)
- Interface ID
- Error type and code
- Command/telemetry ID if applicable
- Retry count
- Recovery action taken
- System state before and after

### 11.4 Fault Tolerance

| Failure Mode | Detection Method | Recovery Action | Max Recovery Time |
|--------------|------------------|-----------------|-------------------|
| Bit Error | CRC/Checksum | Retransmit | 100 ms |
| Packet Loss | Sequence Number | Retransmit | 1 s |
| Interface Hang | Timeout | Reset Interface | 5 s |
| Hardware Failure | Self-test | Switch to Backup | 10 s |
| Power Loss | Voltage Monitor | Safe Mode | Immediate |

---

`;
  }

  /**
   * Generate test procedures section
   */
  private generateTestProcedures(_interfaces: Map<string, InterfaceDefinition>): string {
    return `## 12. Test Procedures

### 12.1 Interface Verification Test Matrix

| Test ID | Test Description | Pass Criteria | Test Level |
|---------|------------------|---------------|------------|
| IVT-001 | Continuity Test | < 1Ω resistance | Unit |
| IVT-002 | Insulation Test | > 100MΩ | Unit |
| IVT-003 | Signal Integrity | Eye diagram pass | Unit |
| IVT-004 | Bit Error Rate | < 1E-9 | System |
| IVT-005 | Throughput Test | > 90% theoretical | System |
| IVT-006 | Latency Test | < 100ms end-to-end | System |
| IVT-007 | Error Recovery | All errors recovered | System |
| IVT-008 | EMI/EMC Test | Meet MIL-STD-461G | System |

### 12.2 Test Setup

\`\`\`
+-------------+     +----------------+     +-------------+
|   Unit A    |<--->| Test Equipment |<--->|   Unit B    |
+-------------+     +----------------+     +-------------+
                           |
                           v
                    +--------------+
                    | Data Logger  |
                    +--------------+
\`\`\`

### 12.3 Detailed Test Procedures

#### IVT-001: Continuity Test

**Purpose:** Verify electrical continuity of all interface connections

**Equipment Required:**
- Digital Multimeter (DMM)
- Interface test cables
- Breakout box

**Procedure:**
1. Power off all equipment
2. Connect breakout box to interface connector
3. Measure resistance between corresponding pins
4. Record all measurements
5. Verify resistance < 1Ω for all signal paths

**Pass Criteria:** All signal paths show < 1Ω resistance

#### IVT-004: Bit Error Rate Test

**Purpose:** Verify data integrity under nominal conditions

**Equipment Required:**
- Bit Error Rate Tester (BERT)
- Interface cables
- Power supplies

**Procedure:**
1. Connect BERT to interface under test
2. Configure for appropriate protocol and data rate
3. Send pseudo-random bit sequence (PRBS-23)
4. Run test for minimum 1E10 bits
5. Record error count and calculate BER

**Pass Criteria:** BER < 1E-9

### 12.4 Test Data Recording

All test data shall be recorded in the following format:

| Timestamp | Test ID | DUT S/N | Measurement | Result | Operator |
|-----------|---------|---------|-------------|--------|----------|
| ISO-8601 | IVT-XXX | 12345 | Value±Tolerance | PASS/FAIL | Initials |

---

`;
  }

  /**
   * Generate appendices
   */
  private generateAppendices(metadata: ICDMetadata): string {
    return `## 13. Appendices

### Appendix A: Acronyms and Abbreviations

| Acronym | Definition |
|---------|------------|
| ACK | Acknowledgment |
| AIT | Assembly, Integration, and Test |
| BER | Bit Error Rate |
| CAN | Controller Area Network |
| CCSDS | Consultative Committee for Space Data Systems |
| CRC | Cyclic Redundancy Check |
| DUT | Device Under Test |
| ECSS | European Cooperation for Space Standardization |
| EMI/EMC | Electromagnetic Interference/Compatibility |
| ICD | Interface Control Document |
| LVDS | Low-Voltage Differential Signaling |
| NAK | Negative Acknowledgment |
| PRBS | Pseudo-Random Bit Sequence |
| SPI | Serial Peripheral Interface |
| TBD | To Be Determined |
| TBR | To Be Resolved |

### Appendix B: Connector Pinout Tables

[Detailed pinout tables for each connector type would be included here]

### Appendix C: Cable Drawings

[Cable assembly drawings and wiring diagrams would be included here]

### Appendix D: Timing Diagrams

[Detailed timing diagrams for each protocol would be included here]

### Appendix E: State Transition Tables

[Complete state transition tables for each protocol would be included here]

### Appendix F: Error Code Reference

[Complete listing of all error codes and their meanings]

### Appendix G: Test Report Template

[Standard template for recording test results]

---

**END OF DOCUMENT**

*This ICD is a controlled document. Please verify you have the latest version before use.*

**Classification:** ${metadata.classification}  
**Document Number:** ${metadata.documentNumber}  
**Version:** ${metadata.version}  
`;
  }

  /**
   * Generate ASCII art diagram
   */
  private generateASCIIDiagram(_components: EquipmentData[], _connections: InterfaceConnection[]): string {
    // Simplified ASCII diagram
    return `
        ┌─────────────┐
        │   Ground    │
        │   Station   │
        └──────┬──────┘
               │ RF Link
        ┌──────▼──────┐
        │  Spacecraft │
        │     Bus     │
        └──┬───────┬──┘
           │       │
    ┌──────▼──┐ ┌──▼──────┐
    │ Payload │ │ Power   │
    │         │ │ System  │
    └─────────┘ └─────────┘
    `;
  }

  /**
   * Generate packet diagram
   */
  private generatePacketDiagram(cmd: CommandDefinition): string {
    let diagram = `
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|    Opcode     |    Length     |          Sequence #           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
`;

    if (cmd.parameters.length > 0) {
      diagram += `|                         Parameters                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
`;
    }

    diagram += `|            CRC-16             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
`;

    return diagram;
  }

  /**
   * Get interface type description
   */
  private getInterfaceTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      serial: "Asynchronous serial communication (UART/RS-232/RS-485)",
      spi: "Serial Peripheral Interface for high-speed synchronous communication",
      i2c: "Inter-Integrated Circuit for low-speed peripheral communication",
      ethernet: "IEEE 802.3 Ethernet for network communication",
      spacewire: "ESA standard for high-speed spacecraft communication",
      can: "Controller Area Network for robust vehicle communication",
      rs422: "Differential serial communication for long distances",
      rs485: "Multi-drop differential serial communication",
      custom: "Proprietary or mission-specific interface",
    };

    return descriptions[type] || "Unknown interface type";
  }

  /**
   * Export ICD to different formats
   */
  exportICD(content: string, format: "md" | "pdf" | "docx" | "html" = "md"): string | Blob {
    switch (format) {
      case "md":
        return content;

      case "html":
        // Convert markdown to HTML
        // In production, use a proper markdown parser
        return `<!DOCTYPE html>
<html>
<head>
  <title>Interface Control Document</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    pre { background-color: #f5f5f5; padding: 10px; overflow-x: auto; }
    h1, h2 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    h3 { color: #555; }
  </style>
</head>
<body>
  ${content.replace(/\n/g, "<br>").replace(/#{1,6}\s(.+)/g, "<h$1>$2</h$1>")}
</body>
</html>`;

      case "pdf":
      case "docx":
        // In production, would use proper document generation libraries
        return new Blob([content], { type: "application/octet-stream" });

      default:
        return content;
    }
  }
}

// Export singleton instance
const icdGenerator = new ICDGeneratorService();
export default icdGenerator;
