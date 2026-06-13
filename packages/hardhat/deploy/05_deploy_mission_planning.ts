import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy Mission Planning Suite contracts
 */
const deployMissionPlanning: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy MissionRegistry
  const missionRegistry = await deploy("MissionRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("✅ MissionRegistry deployed at:", missionRegistry.address);

  // Deploy SpaceEquipmentNFT
  const spaceEquipmentNFT = await deploy("SpaceEquipmentNFT", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("✅ SpaceEquipmentNFT deployed at:", spaceEquipmentNFT.address);

  // Deploy StandardsCompliance
  const standardsCompliance = await deploy("StandardsCompliance", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("✅ StandardsCompliance deployed at:", standardsCompliance.address);

  // Get contract instances for initialization
  const equipmentContract = await hre.ethers.getContractAt("SpaceEquipmentNFT", spaceEquipmentNFT.address);
  const standardsContract = await hre.ethers.getContractAt("StandardsCompliance", standardsCompliance.address);

  // Initialize with sample standards (ECSS standards)
  console.log("📝 Adding initial standards...");

  const standards = [
    {
      code: "ECSS-E-ST-50C",
      title: "Communications",
      type: 0, // ECSS_E
      version: "Rev.2",
      hash: "QmSampleHash1", // In production, this would be actual IPFS hash
    },
    {
      code: "ECSS-E-ST-70C",
      title: "Ground systems and operations",
      type: 0, // ECSS_E
      version: "Rev.1",
      hash: "QmSampleHash2",
    },
    {
      code: "ECSS-M-ST-10C",
      title: "Project planning and implementation",
      type: 1, // ECSS_M
      version: "Rev.1",
      hash: "QmSampleHash3",
    },
    {
      code: "ECSS-Q-ST-80C",
      title: "Software product assurance",
      type: 2, // ECSS_Q
      version: "Rev.1",
      hash: "QmSampleHash4",
    },
    {
      code: "CCSDS-727.0-B-5",
      title: "CCSDS File Delivery Protocol",
      type: 4, // CCSDS_Blue
      version: "B-5",
      hash: "QmSampleHash5",
    },
  ];

  for (const standard of standards) {
    try {
      await standardsContract.addStandard(
        standard.code,
        standard.title,
        standard.type,
        standard.version,
        standard.hash,
      );
      console.log(`  ✅ Added standard: ${standard.code}`);
    } catch {
      console.log(`  ⚠️  Standard ${standard.code} may already exist`);
    }
  }

  // Initialize with sample equipment components
  console.log("🛠️ Adding sample equipment components...");

  const equipmentSamples = [
    {
      name: "SmallSat Bus Platform",
      manufacturer: "CubeSat Systems",
      category: 0, // Bus
      uri: "ipfs://QmEquipment1",
      dataHash: "QmEquipmentData1",
    },
    {
      name: "High-Resolution Camera",
      manufacturer: "OptoSpace Inc",
      category: 1, // Payload
      uri: "ipfs://QmEquipment2",
      dataHash: "QmEquipmentData2",
    },
    {
      name: "Solar Panel Array 3U",
      manufacturer: "SolarSpace Tech",
      category: 2, // PowerSystem
      uri: "ipfs://QmEquipment3",
      dataHash: "QmEquipmentData3",
    },
    {
      name: "Ion Thruster Module",
      manufacturer: "Propulsion Dynamics",
      category: 3, // PropulsionSystem
      uri: "ipfs://QmEquipment4",
      dataHash: "QmEquipmentData4",
    },
    {
      name: "S-Band Transceiver",
      manufacturer: "CommSat Solutions",
      category: 6, // Communication
      uri: "ipfs://QmEquipment5",
      dataHash: "QmEquipmentData5",
    },
  ];

  for (const equipment of equipmentSamples) {
    try {
      const tx = await equipmentContract.mintEquipment(
        deployer,
        equipment.name,
        equipment.manufacturer,
        equipment.category,
        equipment.uri,
        equipment.dataHash,
      );
      await tx.wait();
      console.log(`  ✅ Minted equipment NFT: ${equipment.name}`);
    } catch (error) {
      console.log(`  ⚠️  Error minting ${equipment.name}:`, error);
    }
  }

  console.log("\n🚀 Mission Planning Suite contracts deployed and initialized!");
  console.log("📍 Contract Addresses:");
  console.log("  - MissionRegistry:", missionRegistry.address);
  console.log("  - SpaceEquipmentNFT:", spaceEquipmentNFT.address);
  console.log("  - StandardsCompliance:", standardsCompliance.address);
};

export default deployMissionPlanning;

deployMissionPlanning.tags = ["MissionPlanning"];
