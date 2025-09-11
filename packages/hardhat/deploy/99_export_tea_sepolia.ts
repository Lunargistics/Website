import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import * as fs from "fs";
import * as path from "path";

/**
 * Export TEA Sepolia deployments to frontend
 */
const exportTeaSepoliaContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;

  // Only run this on TEA Sepolia network
  if (hre.network.name !== "teaSepolia" && hre.network.config.chainId !== 10218) {
    console.log("Skipping TEA Sepolia export - not on TEA Sepolia network");
    return;
  }

  console.log("📝 Exporting TEA Sepolia contract deployments...");

  // TEA Sepolia deployed contracts with their addresses
  const TEA_SEPOLIA_CONTRACTS = {
    YourContract: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
    SpaceActivityManager: "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
    MissionRegistry: "0x4A679253410272dd5232B3Ff7cF5dbB88f295319",
    SpaceEquipmentNFT: "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F",
    SpaceDocumentNFT: "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
    AsteroidCommodityToken: "0xc5a5C42992dECbae36851359345FE25997F5C42d",
  };

  const contracts: any = {};

  // Get ABIs from existing deployments or artifacts
  for (const [contractName, address] of Object.entries(TEA_SEPOLIA_CONTRACTS)) {
    try {
      // Try to get ABI from deployment
      let abi;
      try {
        const deployment = await deployments.get(contractName);
        abi = deployment.abi;
      } catch {
        // If no deployment, try to get from artifacts
        const artifact = await hre.artifacts.readArtifact(contractName);
        abi = artifact.abi;
      }

      contracts[contractName] = {
        address,
        abi,
      };
      console.log(`  ✅ Exported ${contractName} at ${address}`);
    } catch {
      console.log(`  ⚠️  Could not find ABI for ${contractName}`);
    }
  }

  // Write to deployedContracts.ts
  const deployedContractsPath = path.join(__dirname, "../../nextjs/contracts/teaSepoliaContracts.ts");

  const content = `/**
 * TEA Sepolia Deployed Contracts
 * Chain ID: 10218
 * Last Updated: ${new Date().toISOString()}
 */

export const teaSepoliaContracts = {
  10218: ${JSON.stringify(contracts, null, 2)}
} as const;
`;

  fs.writeFileSync(deployedContractsPath, content);
  console.log(`\n✅ Exported TEA Sepolia contracts to ${deployedContractsPath}`);
};

export default exportTeaSepoliaContracts;

exportTeaSepoliaContracts.tags = ["ExportTeaSepolia"];
