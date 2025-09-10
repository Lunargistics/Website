import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploySpaceElements: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying SpaceElements contracts with account:", deployer);

  // Deploy SpaceElementsNFT
  const spaceElementsNFT = await deploy("SpaceElementsNFT", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("SpaceElementsNFT deployed to:", spaceElementsNFT.address);

  // Deploy SpaceElementsMarketplace
  const spaceElementsMarketplace = await deploy("SpaceElementsMarketplace", {
    from: deployer,
    args: [spaceElementsNFT.address],
    log: true,
    autoMine: true,
  });

  console.log("SpaceElementsMarketplace deployed to:", spaceElementsMarketplace.address);

  // Get the contracts for verification
  const nftContract = await hre.ethers.getContract("SpaceElementsNFT", deployer);
  const marketplaceContract = await hre.ethers.getContract("SpaceElementsMarketplace", deployer);

  console.log("✅ SpaceElements contracts deployed successfully!");
  console.log("NFT Contract:", nftContract.address);
  console.log("Marketplace Contract:", marketplaceContract.address);
};

export default deploySpaceElements;
deploySpaceElements.tags = ["SpaceElements"];
