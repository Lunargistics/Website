/**
 * Script to update deployedContracts.ts with TEA Sepolia contract addresses
 */

import fs from "fs";
import path from "path";

// TEA Sepolia deployed contracts
const TEA_SEPOLIA_CONTRACTS = {
  YourContract: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
  SpaceActivityManager: "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
  MissionRegistry: "0x4A679253410272dd5232B3Ff7cF5dbB88f295319",
  SpaceEquipmentNFT: "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F",
  SpaceDocumentNFT: "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
  AsteroidCommodityToken: "0xc5a5C42992dECbae36851359345FE25997F5C42d",
};

// Network configuration
const TEA_SEPOLIA_CHAIN_ID = 10218;

async function updateContracts() {
  console.log("📝 Updating TEA Sepolia contracts in deployedContracts.ts...");

  const deployedContractsPath = path.join(
    __dirname,
    "../../nextjs/contracts/deployedContracts.ts"
  );

  // Read the existing file
  let content = fs.readFileSync(deployedContractsPath, "utf8");

  // Update each contract address for TEA Sepolia network
  for (const [contractName, address] of Object.entries(TEA_SEPOLIA_CONTRACTS)) {
    console.log(`  - Updating ${contractName}: ${address}`);
    
    // Find and update the address for this contract in the TEA Sepolia section
    const pattern = new RegExp(
      `(${TEA_SEPOLIA_CHAIN_ID}:\\s*{[^}]*${contractName}:\\s*{\\s*address:\\s*")0x[a-fA-F0-9]{40}(")`,
      "gs"
    );
    
    if (content.match(pattern)) {
      content = content.replace(pattern, `$1${address}$2`);
      console.log(`    ✅ Updated existing ${contractName}`);
    } else {
      console.log(`    ⚠️  ${contractName} not found in TEA Sepolia section`);
    }
  }

  // Write the updated content back
  fs.writeFileSync(deployedContractsPath, content);
  console.log("\n✅ Successfully updated TEA Sepolia contract addresses!");

  // Verify the updates
  console.log("\n📋 Verifying updates...");
  const updatedContent = fs.readFileSync(deployedContractsPath, "utf8");
  
  for (const [contractName, expectedAddress] of Object.entries(TEA_SEPOLIA_CONTRACTS)) {
    const pattern = new RegExp(
      `${contractName}:\\s*{\\s*address:\\s*"(0x[a-fA-F0-9]{40})"`,
      "g"
    );
    const matches = [...updatedContent.matchAll(pattern)];
    const teaSepoliaMatch = matches.find((match) => {
      // Check if this match is in the TEA Sepolia section (should be first occurrence)
      const beforeMatch = updatedContent.substring(0, match.index || 0);
      return beforeMatch.includes(`${TEA_SEPOLIA_CHAIN_ID}:`);
    });
    
    if (teaSepoliaMatch && teaSepoliaMatch[1] === expectedAddress) {
      console.log(`  ✅ ${contractName}: ${expectedAddress}`);
    } else if (teaSepoliaMatch) {
      console.log(`  ❌ ${contractName}: Found ${teaSepoliaMatch[1]}, expected ${expectedAddress}`);
    } else {
      console.log(`  ❌ ${contractName}: Not found in TEA Sepolia section`);
    }
  }
}

// Run the update
updateContracts().catch(console.error);
