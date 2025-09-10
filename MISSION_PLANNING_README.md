# 🚀 Mission Planning Suite - Complete Documentation

## Overview
The Mission Planning Suite is a comprehensive end-to-end space mission planning platform that integrates advanced orbital mechanics, 3D visualization, and blockchain technology. It provides all the tools needed for mission design, analysis, compliance tracking, and documentation generation.

## ✨ Key Features

### 1. **Mission Design & Management**
- Complete mission lifecycle planning (Pre-Phase A through Phase F)
- Mission types: Earth Observation, Communications, Science, Navigation, etc.
- Budget tracking and resource allocation
- Requirements management and traceability
- Multi-phase mission timeline planning

### 2. **Orbital Mechanics & Analysis**
- TLE (Two-Line Element) parsing and orbit propagation
- Orbital elements calculation and visualization
- Ground station visibility (AOS/LOS) analysis
- Sensor field-of-view and coverage analysis
- Eclipse event detection
- Orbital maneuver planning with delta-v calculations
- Constellation design (Walker and custom configurations)
- Inter-satellite link analysis

### 3. **3D Earth Visualization**
- Real-time satellite tracking
- Orbit and ground track visualization
- Sensor footprint projection
- Ground station visibility cones
- Day/night terminator display
- Multi-satellite constellation support
- Interactive timeline with simulation controls

### 4. **Equipment & Configuration**
- NFT-based equipment library
- Component compatibility checking
- Mass, power, and cost budget analysis
- Technology Readiness Level (TRL) tracking
- Heritage and space qualification tracking

### 5. **Standards Compliance**
- ECSS standards library and tracking
- CCSDS format support
- Compliance matrices and checklists
- Audit trail functionality
- Requirements verification tracking

### 6. **AIT Planning**
- Assembly, Integration & Test scheduling
- Test task management
- Resource allocation
- Timeline visualization
- Results capture and tracking

### 7. **Documentation Generation**
- Automated PDR (Preliminary Design Review) generation
- CDR (Critical Design Review) documents
- Flight Readiness Reviews (FRR)
- Test reports and compliance matrices
- Export to Markdown, HTML, PDF formats

### 8. **Data Management**
- IPFS/Pinata decentralized storage
- Blockchain-based mission registration
- TLE/OEM/CCSDS format import/export
- Mission data archival
- Version control and audit trails

## 🛠️ Technical Architecture

### Smart Contracts
- **MissionRegistry.sol** - On-chain mission lifecycle management
- **SpaceEquipmentNFT.sol** - Equipment library with specifications
- **StandardsCompliance.sol** - Standards tracking and verification

### Services
- **OrbitService** - Orbital mechanics calculations (satellite.js)
- **PinataService** - IPFS storage integration
- **DocumentGenerator** - Automated document creation

### APIs
- `/api/missions` - Mission CRUD operations
- `/api/orbit/propagate` - Orbit calculation services
- `/api/constellation` - Constellation analysis
- `/api/documents/generate` - Document generation

## 📋 Setup Instructions

### 1. Environment Configuration
Create a `.env.local` file in `packages/nextjs/` with:

```env
# Pinata IPFS Configuration (Required)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# MongoDB Configuration (if using)
MONGODB_URI=mongodb://localhost:27017/lunar-website
MONGODB_DB=lunar-website
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Deploy Smart Contracts
```bash
yarn deploy
```

### 4. Start Development Server
```bash
yarn start
```

## 🎯 Using the Mission Planning Suite

### Accessing the Suite
1. Navigate to the Dashboard at `/dashboard`
2. Click on "Mission Planning" in the sidebar or overview grid
3. The suite opens with multiple tabs for different functions

### Mission Design Workflow

#### Step 1: Mission Design
1. Enter mission name and select mission type
2. Define mission objectives
3. Set launch and end dates
4. Configure budget parameters
5. Add ground stations for communication

#### Step 2: Orbit Analysis
1. Input TLE data or use sample orbits
2. Parse TLE to calculate orbital elements
3. View ground track and coverage
4. Analyze ground station access windows

#### Step 3: Equipment Selection
1. Browse equipment library by category
2. Select components for your mission
3. Check compatibility and constraints
4. Monitor mass, power, and cost budgets

#### Step 4: AIT Planning
1. Create test tasks and schedules
2. Define test procedures
3. Track test results and compliance

#### Step 5: Compliance Tracking
1. Add applicable standards (ECSS, CCSDS, etc.)
2. Create compliance checklists
3. Track verification status
4. Generate compliance matrices

#### Step 6: 3D Visualization
1. View satellite orbits in real-time
2. Simulate mission timeline
3. Analyze coverage and visibility
4. Export visualizations

#### Step 7: Documentation
1. Generate PDR/CDR documents
2. Create test reports
3. Export compliance matrices
4. Save all documents to IPFS

### API Integration

#### Create Mission
```javascript
const response = await fetch('/api/missions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Mission Name",
    type: "Earth Observation",
    objectives: ["Objective 1", "Objective 2"],
    // ... other mission data
  })
});
```

#### Propagate Orbit
```javascript
const response = await fetch('/api/orbit/propagate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tle: {
      line1: "1 25544U 98067A...",
      line2: "2 25544 51.6442..."
    },
    startTime: "2024-01-01T00:00:00Z",
    endTime: "2024-01-02T00:00:00Z",
    stepMinutes: 5
  })
});
```

#### Generate Document
```javascript
const response = await fetch('/api/documents/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mission: missionData,
    documentType: "PDR",
    format: "md",
    saveToIPFS: true
  })
});
```

## 📊 Data Formats

### TLE Format
```
1 25544U 98067A   21321.23456789  .00001234  00000-0  12345-4 0  9999
2 25544  51.6442 123.4567 0001234  45.6789 314.5678 15.48919393123456
```

### CCSDS OEM Format
```
CCSDS_OEM_VERS = 2.0
OBJECT_NAME = SATELLITE
OBJECT_ID = 001
CENTER_NAME = EARTH
REF_FRAME = EME2000
TIME_SYSTEM = UTC
START_TIME = 2024-01-01T00:00:00.000Z
STOP_TIME = 2024-01-02T00:00:00.000Z

DATA_START
2024-01-01T00:00:00.000Z 6878.137 0.0 0.0 0.0 7.5 0.0
...
DATA_STOP
```

## 🔐 Smart Contract Addresses (Localhost)
- MissionRegistry: `0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575`
- SpaceEquipmentNFT: `0xCD8a1C3ba11CF5ECfa6267617243239504a98d90`
- StandardsCompliance: `0x82e01223d51Eb87e16A03E24687EDF0F294da6f1`

## 🌟 Advanced Features

### Constellation Design
Create Walker constellations with specified parameters:
- Total satellites
- Number of orbital planes
- Altitude and inclination
- Phasing configuration

### Maneuver Planning
Calculate orbital maneuvers:
- Hohmann transfers
- Inclination changes
- Station-keeping maneuvers
- De-orbit burns

### Coverage Analysis
Analyze sensor coverage:
- Ground footprint calculation
- Swath width determination
- Revisit time analysis
- Area of Interest (AOI) coverage

## 🤝 Contributing
The Mission Planning Suite is open for contributions. Key areas for enhancement:
- Additional orbital perturbation models
- More document templates
- Enhanced visualization features
- Additional equipment database entries
- Extended standards library

## 📚 References
- ECSS Standards: https://ecss.nl/
- CCSDS Standards: https://public.ccsds.org/
- Satellite.js Documentation: https://github.com/shashwatak/satellite-js
- Three.js Documentation: https://threejs.org/

## 🆘 Support
For issues or questions:
1. Check the console for error messages
2. Ensure all environment variables are set
3. Verify smart contracts are deployed
4. Check that IPFS/Pinata service is configured

## 📝 License
MIT License - See LICENSE file for details

---

**Built with ❤️ for the future of space exploration**
