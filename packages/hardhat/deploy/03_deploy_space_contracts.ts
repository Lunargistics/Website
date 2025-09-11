import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploySpaceContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying Space Smart Wallet contracts...");

  // Deploy ERC6551Registry
  const registry = await deploy("ERC6551Registry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("ERC6551Registry deployed to:", registry.address);

  // Deploy SpaceSmartWallet implementation
  const implementation = await deploy("SpaceSmartWallet", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("SpaceSmartWallet implementation deployed to:", implementation.address);

  // Deploy SpaceDocumentNFT
  const documentNFT = await deploy("SpaceDocumentNFT", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("SpaceDocumentNFT deployed to:", documentNFT.address);

  console.log("\n📋 Contract Addresses:");
  console.log("Registry:", registry.address);
  console.log("Implementation:", implementation.address);
  console.log("Document NFT:", documentNFT.address);
  console.log("\nAdd these addresses to your .env.local file in packages/nextjs/");
};

export default deploySpaceContracts;

deploySpaceContracts.tags = ["SpaceContracts"];
