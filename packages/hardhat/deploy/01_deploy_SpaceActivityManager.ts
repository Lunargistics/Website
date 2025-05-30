import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys a contract named "SpaceActivityManager" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySpaceActivityManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the first account HRE provides an address for.
    In test environments, the deployer account is  hre.ethers.Wallet.createRandom()
    and seedphrases aren't used.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("SpaceActivityManager", {
    from: deployer,
    // Contract constructor arguments (if any)
    // args: [deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deployment if needed
  // const spaceActivityManager = await hre.ethers.getContract<Contract("SpaceActivityManager", deployer);
  // console.log("👋 Initial greeting:", await spaceActivityManager.greeting());
};

export default deploySpaceActivityManager;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags SpaceActivityManager
deploySpaceActivityManager.tags = ["SpaceActivityManager"];
