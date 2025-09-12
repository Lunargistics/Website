#!/bin/bash
echo "Deploying remaining contracts to TEA Sepolia..."
echo "Adding delays between deployments to avoid rate limiting"
echo ""

contracts=(
  "MissionRegistry"
  "SpaceEquipmentNFT" 
  "SpaceDocumentNFT"
  "AsteroidCommodityToken"
  "StandardsCompliance"
  "SpaceElementsNFT"
  "SpaceElementsMarketplace"
  "AsteroidDEX"
  "AsteroidFutures"
  "AsteroidLiquidityPool"
  "AsteroidOracle"
  "AsteroidTokenFactory"
  "ERC6551Registry"
  "SpaceSmartWallet"
)

for contract in "${contracts[@]}"; do
  echo "Deploying $contract..."
  npx hardhat deploy --network teaSepolia --tags "$contract" 2>&1 | grep -E "deployed at|already deployed|reusing" || true
  echo "Waiting 15 seconds before next deployment..."
  sleep 15
done

echo ""
echo "Deployment complete!"
