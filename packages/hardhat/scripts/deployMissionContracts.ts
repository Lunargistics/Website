import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying Mission Planning contracts to TEA Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "TEA\n");

  try {
    // Deploy MissionRegistry
    console.log("Deploying MissionRegistry...");
    const MissionRegistry = await ethers.getContractFactory("MissionRegistry");
    const missionRegistry = await MissionRegistry.deploy();
    await missionRegistry.waitForDeployment();
    const missionAddress = await missionRegistry.getAddress();
    console.log("✅ MissionRegistry deployed to:", missionAddress);

    // Deploy SpaceEquipmentNFT
    console.log("\nDeploying SpaceEquipmentNFT...");
    const SpaceEquipmentNFT = await ethers.getContractFactory("SpaceEquipmentNFT");
    const spaceEquipmentNFT = await SpaceEquipmentNFT.deploy();
    await spaceEquipmentNFT.waitForDeployment();
    const equipmentAddress = await spaceEquipmentNFT.getAddress();
    console.log("✅ SpaceEquipmentNFT deployed to:", equipmentAddress);

    // Deploy StandardsCompliance
    console.log("\nDeploying StandardsCompliance...");
    const StandardsCompliance = await ethers.getContractFactory("StandardsCompliance");
    const standardsCompliance = await StandardsCompliance.deploy();
    await standardsCompliance.waitForDeployment();
    const standardsAddress = await standardsCompliance.getAddress();
    console.log("✅ StandardsCompliance deployed to:", standardsAddress);

    // Save deployment info
    const deploymentInfo = {
      network: "TEA Sepolia",
      chainId: 10218,
      deployer: deployer.address,
      contracts: {
        MissionRegistry: missionAddress,
        SpaceEquipmentNFT: equipmentAddress,
        StandardsCompliance: standardsAddress,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("\n📋 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Save to file
    fs.writeFileSync("deployments/teaSepolia/missionContracts.json", JSON.stringify(deploymentInfo, null, 2));

    console.log("\n✅ All Mission Planning contracts deployed successfully!");
    console.log("\n🌐 View on TEA Sepolia Explorer:");
    console.log(`   MissionRegistry: https://testnet.explorer.tea.xyz/address/${missionAddress}`);
    console.log(`   SpaceEquipmentNFT: https://testnet.explorer.tea.xyz/address/${equipmentAddress}`);
    console.log(`   StandardsCompliance: https://testnet.explorer.tea.xyz/address/${standardsAddress}`);
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
