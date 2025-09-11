import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployAsteroidContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy Oracle
  const oracleResult = await deploy("AsteroidOracle", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Deploy Token Factory
  const tokenFactoryResult = await deploy("AsteroidTokenFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Deploy DEX with Token Factory address
  const dexResult = await deploy("AsteroidDEX", {
    from: deployer,
    args: [tokenFactoryResult.address],
    log: true,
    autoMine: true,
  });

  // Deploy a mock collateral token for futures (USDC-like)
  const collateralTokenResult = await deploy("AsteroidCommodityToken", {
    from: deployer,
    args: [
      "USD Collateral",
      "USDC",
      "COLLATERAL",
      "USDC",
      hre.ethers.parseEther("1000000"), // 1M initial supply
    ],
    log: true,
    autoMine: true,
  });

  // Deploy Futures contract
  const futuresResult = await deploy("AsteroidFutures", {
    from: deployer,
    args: [oracleResult.address, collateralTokenResult.address],
    log: true,
    autoMine: true,
  });

  console.log("🚀 Asteroid Contracts Deployed:");
  console.log("Oracle:", oracleResult.address);
  console.log("Token Factory:", tokenFactoryResult.address);
  console.log("DEX:", dexResult.address);
  console.log("Collateral Token:", collateralTokenResult.address);
  console.log("Futures:", futuresResult.address);

  // Initialize with sample asteroid data
  if (oracleResult.newlyDeployed) {
    const oracle = await hre.ethers.getContract("AsteroidOracle", deployer);

    // Add some famous asteroids with realistic data
    const asteroids = [
      { id: "16-psyche", name: "16 Psyche", value: "10000000000000000", diameter: "226000" },
      { id: "433-eros", name: "433 Eros", value: "20000000000000", diameter: "16840" },
      { id: "3554-amun", name: "3554 Amun", value: "8000000000000", diameter: "2480" },
      { id: "1986-da", name: "1986 DA", value: "15000000000000", diameter: "3000" },
      { id: "2011-uw158", name: "2011 UW158", value: "5400000000000", diameter: "452" },
    ];

    for (const asteroid of asteroids) {
      await oracle.updateAsteroidData(asteroid.id, asteroid.name, asteroid.value, asteroid.diameter);

      // Add composition data
      await oracle.batchUpdateComposition(
        asteroid.id,
        ["iron", "nickel", "cobalt", "platinum", "gold"],
        [4500, 2500, 1500, 1000, 500], // Percentages (out of 10000)
      );
    }

    console.log("✅ Oracle initialized with asteroid data");
  }

  // Create initial tokens for major commodities
  if (tokenFactoryResult.newlyDeployed) {
    const tokenFactory = await hre.ethers.getContract("AsteroidTokenFactory", deployer);

    const commodities = [
      { asteroidId: "16-psyche", commodity: "iron", supply: "1000000" },
      { asteroidId: "16-psyche", commodity: "nickel", supply: "500000" },
      { asteroidId: "16-psyche", commodity: "platinum", supply: "100000" },
      { asteroidId: "433-eros", commodity: "gold", supply: "50000" },
      { asteroidId: "3554-amun", commodity: "cobalt", supply: "250000" },
    ];

    for (const item of commodities) {
      await tokenFactory.createAsteroidToken(item.asteroidId, item.commodity, hre.ethers.parseEther(item.supply));
    }

    console.log("✅ Initial commodity tokens created");
  }
};

export default deployAsteroidContracts;

deployAsteroidContracts.tags = ["AsteroidContracts"];
