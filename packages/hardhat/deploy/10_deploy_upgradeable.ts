import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";

/**
 * Deploy upgradeable contracts using OpenZeppelin's UUPS pattern
 */
const deployUpgradeableContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { save, getArtifact } = deployments;
  const {} = await getNamedAccounts();

  console.log("\n📦 Deploying upgradeable contracts...\n");

  // Deploy MissionRegistryV2 as upgradeable
  console.log("🚀 Deploying MissionRegistryV2 (Upgradeable)...");

  try {
    const MissionRegistryV2 = await ethers.getContractFactory("MissionRegistryV2");

    const missionRegistry = await upgrades.deployProxy(
      MissionRegistryV2,
      [], // initialize() takes no arguments
      {
        kind: "uups",
        initializer: "initialize",
      },
    );

    await missionRegistry.deployed();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(missionRegistry.address);

    console.log("✅ MissionRegistryV2 deployed:");
    console.log("   Proxy address:", missionRegistry.address);
    console.log("   Implementation address:", implementationAddress);

    // Save the deployment
    const artifact = await getArtifact("MissionRegistryV2");
    await save("MissionRegistryV2", {
      address: missionRegistry.address,
      abi: artifact.abi,
      implementation: implementationAddress,
    });

    // Verify the implementation contract if not on localhost
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
      console.log("\n📝 Verifying implementation contract...");
      try {
        await hre.run("verify:verify", {
          address: implementationAddress,
          constructorArguments: [],
        });
        console.log("✅ Implementation verified");
      } catch (error) {
        console.log("⚠️  Verification failed:", error);
      }
    }

    // Deploy other upgradeable contracts similarly
    // You can add SpaceEquipmentNFTV2, StandardsComplianceV2, etc.

    console.log("\n✅ Upgradeable contracts deployment complete!");
  } catch (error) {
    console.error("❌ Error deploying upgradeable contracts:", error);
    throw error;
  }
};

export default deployUpgradeableContracts;
deployUpgradeableContracts.tags = ["Upgradeable"];
deployUpgradeableContracts.dependencies = [];
