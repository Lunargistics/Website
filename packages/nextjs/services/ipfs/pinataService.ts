import axios from 'axios';

/**
 * Pinata IPFS Service for Mission Planning Suite
 * Handles all IPFS storage for mission data, documents, and 3D models
 */

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

interface PinataMetadata {
  name: string;
  keyvalues?: Record<string, any>;
}

interface PinataOptions {
  cidVersion?: 0 | 1;
  wrapWithDirectory?: boolean;
}

interface MissionData {
  id?: string;
  name: string;
  type: string;
  description: string;
  objectives: string[];
  phases: {
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  }[];
  equipment: {
    id: string;
    name: string;
    category: string;
    specs: any;
  }[];
  orbit?: {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    raan: number;
    argumentOfPerigee: number;
    trueAnomaly: number;
    epoch: string;
  };
  groundStations?: {
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
  }[];
  requirements?: {
    id: string;
    description: string;
    verified: boolean;
  }[];
  aitPlan?: any;
  documents?: {
    name: string;
    type: string;
    hash: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface OrbitData {
  tle?: {
    line1: string;
    line2: string;
  };
  oem?: {
    version: string;
    creationDate: string;
    originator: string;
    objectName: string;
    objectId: string;
    centerName: string;
    refFrame: string;
    timeSystem: string;
    startTime: string;
    stopTime: string;
    ephemerides: {
      epoch: string;
      position: [number, number, number];
      velocity: [number, number, number];
    }[];
  };
  propagatedStates?: {
    epoch: string;
    position: [number, number, number];
    velocity: [number, number, number];
  }[];
}

interface EquipmentData {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  specifications: {
    mass: number;
    power: number;
    dataRate: number;
    volume: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    interfaces: string[];
    operatingTemp: {
      min: number;
      max: number;
    };
    trl: number;
    heritage: number;
    spaceQualified: boolean;
  };
  compliance: {
    standards: string[];
    certifications: string[];
  };
  documentation: {
    datasheet?: string;
    userManual?: string;
    interfaceControl?: string;
    testReports?: string[];
  };
  cadModel?: {
    format: string;
    fileHash: string;
  };
}

class PinataService {
  private headers: Record<string, string>;

  constructor() {
    this.headers = {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    };

    if (PINATA_JWT) {
      this.headers = {
        'Authorization': `Bearer ${PINATA_JWT}`,
      };
    }
  }

  /**
   * Pin JSON data to IPFS
   */
  async pinJSON(data: any, metadata: PinataMetadata): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: data,
          pinataMetadata: metadata,
        },
        { headers: this.headers }
      );
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error pinning JSON to IPFS:', error);
      throw error;
    }
  }

  /**
   * Pin file to IPFS
   */
  async pinFile(file: File, metadata: PinataMetadata): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pinataMetadata', JSON.stringify(metadata));

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...this.headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error pinning file to IPFS:', error);
      throw error;
    }
  }

  /**
   * Get data from IPFS
   */
  async getData(hash: string): Promise<any> {
    try {
      const response = await axios.get(`${PINATA_GATEWAY}${hash}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw error;
    }
  }

  /**
   * Pin mission data
   */
  async pinMissionData(missionData: MissionData): Promise<string> {
    const metadata: PinataMetadata = {
      name: `mission_${missionData.name}_${Date.now()}`,
      keyvalues: {
        type: 'mission',
        missionName: missionData.name,
        missionType: missionData.type,
        createdAt: missionData.createdAt,
      },
    };
    return this.pinJSON(missionData, metadata);
  }

  /**
   * Pin orbit data (TLE/OEM)
   */
  async pinOrbitData(orbitData: OrbitData, missionName: string): Promise<string> {
    const metadata: PinataMetadata = {
      name: `orbit_${missionName}_${Date.now()}`,
      keyvalues: {
        type: 'orbit',
        missionName: missionName,
        hasTLE: !!orbitData.tle,
        hasOEM: !!orbitData.oem,
      },
    };
    return this.pinJSON(orbitData, metadata);
  }

  /**
   * Pin equipment specifications
   */
  async pinEquipmentData(equipmentData: EquipmentData): Promise<string> {
    const metadata: PinataMetadata = {
      name: `equipment_${equipmentData.name}_${Date.now()}`,
      keyvalues: {
        type: 'equipment',
        equipmentName: equipmentData.name,
        manufacturer: equipmentData.manufacturer,
        category: equipmentData.category,
        trl: equipmentData.specifications.trl,
      },
    };
    return this.pinJSON(equipmentData, metadata);
  }

  /**
   * Pin compliance document
   */
  async pinComplianceDocument(file: File, missionName: string, documentType: string): Promise<string> {
    const metadata: PinataMetadata = {
      name: `compliance_${missionName}_${documentType}_${Date.now()}`,
      keyvalues: {
        type: 'compliance_document',
        missionName: missionName,
        documentType: documentType,
        uploadedAt: new Date().toISOString(),
      },
    };
    return this.pinFile(file, metadata);
  }

  /**
   * Pin 3D model (for equipment or spacecraft)
   */
  async pin3DModel(file: File, modelName: string, modelType: string): Promise<string> {
    const metadata: PinataMetadata = {
      name: `3dmodel_${modelName}_${Date.now()}`,
      keyvalues: {
        type: '3d_model',
        modelName: modelName,
        modelType: modelType, // 'equipment', 'spacecraft', 'ground_station'
        format: file.name.split('.').pop(),
      },
    };
    return this.pinFile(file, metadata);
  }

  /**
   * Pin AIT test results
   */
  async pinAITResults(testData: any, missionName: string, testType: string): Promise<string> {
    const metadata: PinataMetadata = {
      name: `ait_${missionName}_${testType}_${Date.now()}`,
      keyvalues: {
        type: 'ait_results',
        missionName: missionName,
        testType: testType,
        testDate: new Date().toISOString(),
      },
    };
    return this.pinJSON(testData, metadata);
  }

  /**
   * Pin generated driver code
   */
  async pinDriverCode(code: string, componentName: string, language: string): Promise<string> {
    const metadata: PinataMetadata = {
      name: `driver_${componentName}_${language}_${Date.now()}`,
      keyvalues: {
        type: 'driver_code',
        componentName: componentName,
        language: language,
        generatedAt: new Date().toISOString(),
      },
    };
    return this.pinJSON({ code, componentName, language }, metadata);
  }

  /**
   * Unpin data from IPFS (cleanup)
   */
  async unpin(hash: string): Promise<boolean> {
    try {
      await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${hash}`,
        { headers: this.headers }
      );
      return true;
    } catch (error) {
      console.error('Error unpinning from IPFS:', error);
      return false;
    }
  }

  /**
   * List pinned files with filters
   */
  async listPins(filters?: {
    missionName?: string;
    type?: string;
    pageLimit?: number;
    pageOffset?: number;
  }): Promise<any> {
    try {
      const params: any = {
        pageLimit: filters?.pageLimit || 10,
        pageOffset: filters?.pageOffset || 0,
      };

      if (filters?.missionName || filters?.type) {
        params.metadata = {};
        if (filters.missionName) {
          params.metadata.keyvalues = { missionName: { value: filters.missionName, op: 'eq' } };
        }
        if (filters.type) {
          params.metadata.keyvalues = { ...params.metadata.keyvalues, type: { value: filters.type, op: 'eq' } };
        }
      }

      const response = await axios.get(
        'https://api.pinata.cloud/data/pinList',
        { headers: this.headers, params }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing pins:', error);
      throw error;
    }
  }

  /**
   * Generate IPFS gateway URL
   */
  getGatewayUrl(hash: string): string {
    return `${PINATA_GATEWAY}${hash}`;
  }

  /**
   * Batch pin multiple files
   */
  async batchPinFiles(files: { file: File; metadata: PinataMetadata }[]): Promise<string[]> {
    const promises = files.map(({ file, metadata }) => this.pinFile(file, metadata));
    return Promise.all(promises);
  }

  /**
   * Pin mission snapshot (complete mission state)
   */
  async pinMissionSnapshot(
    missionData: MissionData,
    orbitData: OrbitData,
    equipmentList: EquipmentData[],
    documents: { name: string; hash: string }[]
  ): Promise<{
    snapshotHash: string;
    timestamp: string;
  }> {
    const snapshot = {
      mission: missionData,
      orbit: orbitData,
      equipment: equipmentList,
      documents: documents,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    const metadata: PinataMetadata = {
      name: `snapshot_${missionData.name}_${Date.now()}`,
      keyvalues: {
        type: 'mission_snapshot',
        missionName: missionData.name,
        timestamp: snapshot.timestamp,
      },
    };

    const hash = await this.pinJSON(snapshot, metadata);
    return {
      snapshotHash: hash,
      timestamp: snapshot.timestamp,
    };
  }
}

// Export singleton instance
const pinataService = new PinataService();
export default pinataService;

// Export types
export type {
  MissionData,
  OrbitData,
  EquipmentData,
  PinataMetadata,
  PinataOptions,
};
