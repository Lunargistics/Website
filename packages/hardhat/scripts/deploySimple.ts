import { ethers } from "hardhat";

async function main() {
  console.log("Deploying smaller contracts to TEA Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "TEA\n");

  try {
    // Deploy SpaceDocumentNFT (smaller contract)
    console.log("Deploying SpaceDocumentNFT...");
    const SpaceDocumentNFT = await ethers.getContractFactory("SpaceDocumentNFT");
    const spaceDocumentNFT = await SpaceDocumentNFT.deploy();
    await spaceDocumentNFT.waitForDeployment();
    const docAddress = await spaceDocumentNFT.getAddress();
    console.log("✅ SpaceDocumentNFT deployed to:", docAddress);

    const finalBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\nFinal balance:", ethers.formatEther(finalBalance), "TEA");
    console.log("Gas used:", ethers.formatEther(balance - finalBalance), "TEA");

    console.log("\n🌐 View on TEA Sepolia Explorer:");
    console.log(`   https://testnet.explorer.tea.xyz/address/${docAddress}`);
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
